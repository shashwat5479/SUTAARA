import { useState, useRef } from 'react';
import { api } from '../api/client.js';

const CATEGORIES = [
  { value: 'wrong_item',       label: 'Wrong item received' },
  { value: 'damaged',          label: 'Item arrived damaged' },
  { value: 'quality_issue',    label: 'Quality not as expected' },
  { value: 'size_issue',       label: 'Size / fit issue' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'other',            label: 'Other reason' },
];

// Flipkart-style return request modal: reason + category + photo upload
export default function ReturnRequestModal({ order, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=form, 2=uploading, 3=done
  const [form, setForm] = useState({ reason: '', category: 'damaged', description: '' });
  const [photos, setPhotos] = useState([]); // { file, preview, url? }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      url: null,
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    e.target.value = '';
  };

  const removePhoto = (i) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  // Upload a single photo — tries Cloudinary presigned URL first,
  // falls back to base64 data URL stored directly (works without Cloudinary)
  const uploadPhoto = async (photo, uploadInfo) => {
    if (uploadInfo.method === 'cloudinary') {
      const fd = new FormData();
      fd.append('file', photo.file);
      fd.append('api_key', uploadInfo.apiKey);
      fd.append('timestamp', uploadInfo.timestamp);
      fd.append('signature', uploadInfo.signature);
      fd.append('folder', uploadInfo.folder);
      const res = await fetch(uploadInfo.url, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      return data.secure_url;
    }
    // Fallback: base64 data URL stored directly
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(photo.file);
    });
  };

  const submit = async () => {
    if (!form.reason.trim()) { setError('Please describe the issue'); return; }
    if (photos.length === 0) { setError('Please upload at least one photo showing the issue'); return; }
    setError('');
    setBusy(true);
    setStep(2);
    try {
      // Get upload config
      const uploadInfo = await api.getReturnUploadUrl();

      // Upload all photos
      const urls = await Promise.all(photos.map((p) => uploadPhoto(p, uploadInfo)));

      // Submit the return request
      const rr = await api.submitReturnRequest(order._id, {
        reason: form.reason.trim(),
        category: form.category,
        description: form.description.trim() || undefined,
        photos: urls,
      });

      setStep(3);
      onSuccess(rr);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rr-modal">
        <div className="rr-modal__head">
          <h2>Request return / refund</h2>
          <button className="rr-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {step === 3 ? (
          <div className="rr-modal__success">
            <div className="rr-modal__success-icon">✓</div>
            <h3>Request submitted</h3>
            <p>We'll review it within 24–48 hours and email you at every step. If your return is approved, refunds go back to the original payment method automatically.</p>
            <button className="btn btn--primary" onClick={onClose}>Done</button>
          </div>
        ) : step === 2 ? (
          <div className="rr-modal__uploading">
            <div className="spinner" />
            <p>Uploading photos and submitting…</p>
          </div>
        ) : (
          <div className="rr-modal__body">
            {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

            <div className="field">
              <label>What's the issue?</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Describe the problem <span style={{ color: 'var(--sindoor)' }}>*</span></label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="e.g. The dupatta colour is completely different from what was shown online…"
                value={form.reason}
                onChange={set('reason')}
                maxLength={500}
              />
            </div>

            <div className="field">
              <label>Additional details (optional)</label>
              <textarea
                className="textarea"
                rows={2}
                placeholder="Order was opened, tags are intact, item unused…"
                value={form.description}
                onChange={set('description')}
                maxLength={300}
              />
            </div>

            <div className="field">
              <label>
                Photos <span style={{ color: 'var(--sindoor)' }}>*</span>
                <span style={{ color: 'var(--ink-soft)', fontWeight: 400, marginLeft: 6 }}>
                  Up to 5 — show the issue clearly
                </span>
              </label>
              <div className="rr-photos">
                {photos.map((p, i) => (
                  <div key={i} className="rr-photo">
                    <img src={p.preview} alt={`Photo ${i + 1}`} />
                    <button className="rr-photo__remove" onClick={() => removePhoto(i)}>✕</button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    type="button"
                    className="rr-photo rr-photo--add"
                    onClick={() => fileRef.current?.click()}
                  >
                    <span>+</span>
                    <small>Add photo</small>
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={pickFiles}
              />
            </div>

            <div className="rr-modal__note">
              <strong>How it works:</strong> Once you submit, our team reviews your request within 24–48 hours.
              If approved, refunds for online payments go back to your original card/UPI automatically within 5–7 business days.
              For COD orders, we'll reach out to collect your bank or UPI details.
            </div>

            <button
              className="btn btn--primary btn--block"
              onClick={submit}
              disabled={busy}
              style={{ marginTop: 16 }}
            >
              Submit return request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
