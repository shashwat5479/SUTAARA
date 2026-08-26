import { useState, useRef, useCallback } from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'drmpijecc';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sutaara_unsigned';

// Compress/resize a large image in the browser before upload. Keeps quality
// high (max 2400px on the long edge, 0.85 JPEG quality) so large gallery
// photos upload fast without visible loss. Small images pass through untouched.
async function compressImage(file) {
  // Only compress raster images; leave GIFs/SVGs and already-small files alone.
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (file.size < 500 * 1024) return file; // under 0.5MB — not worth it

  try {
    const bitmap = await createImageBitmap(file);
    const MAX = 2400;
    let { width, height } = bitmap;
    if (width > MAX || height > MAX) {
      const scale = MAX / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (!blob || blob.size >= file.size) return file; // no gain — keep original
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file; // if anything fails, upload the original
  }
}

// Uploads one file straight to Cloudinary (browser → Cloudinary, not via our
// server). Reports progress via onProgress. `resourceType` is 'image' or
// 'video' — Cloudinary's /auto/ endpoint detects it, but being explicit lets
// us keep separate size limits.
function uploadToCloudinary(file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else {
        let msg = 'Upload failed';
        try { msg = JSON.parse(xhr.responseText).error?.message || msg; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(form);
  });
}

// Admin media picker: choose images + an optional video from the device
// gallery, upload directly to Cloudinary with live progress, reorder, remove.
// Value shape: { images: string[], video: string }.
export default function MediaUploader({ images = [], video = '', onChange }) {
  const [uploading, setUploading] = useState([]); // [{ id, name, pct, kind }]
  const [error, setError] = useState('');
  const imgInput = useRef(null);
  const vidInput = useRef(null);
  const dragIndex = useRef(null);

  const setImages = (next) => onChange({ images: next, video });
  const setVideo = (next) => onChange({ images, video: next });

  const handleImageFiles = useCallback(async (files) => {
    setError('');
    let list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;

    // Enforce a 25MB per-image cap (before compression).
    const tooBig = list.filter((f) => f.size > 25 * 1024 * 1024);
    if (tooBig.length) {
      setError(`${tooBig.length} image(s) over 25MB were skipped. Please use smaller photos.`);
      list = list.filter((f) => f.size <= 25 * 1024 * 1024);
    }
    if (list.length === 0) return;

    const jobs = list.map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, name: f.name, pct: 0, kind: 'image' }));
    setUploading((u) => [...u, ...jobs]);

    const uploaded = [];
    for (let i = 0; i < list.length; i += 1) {
      try {
        // Compress large photos in-browser first — faster upload, no visible loss.
        const toUpload = await compressImage(list[i]);
        const urlStr = await uploadToCloudinary(toUpload, {
          onProgress: (pct) => setUploading((u) => u.map((j) => (j.id === jobs[i].id ? { ...j, pct } : j))),
        });
        uploaded.push(urlStr);
      } catch (err) {
        setError(err.message);
      } finally {
        setUploading((u) => u.filter((j) => j.id !== jobs[i].id));
      }
    }
    if (uploaded.length) onChange({ images: [...images, ...uploaded], video });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, video]);

  const handleVideoFile = useCallback(async (files) => {
    setError('');
    const file = Array.from(files).find((f) => f.type.startsWith('video/'));
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError('Video is larger than 100MB — please use a shorter clip.');
      return;
    }
    const job = { id: `vid-${Date.now()}`, name: file.name, pct: 0, kind: 'video' };
    setUploading((u) => [...u, job]);
    try {
      const urlStr = await uploadToCloudinary(file, {
        onProgress: (pct) => setUploading((u) => u.map((j) => (j.id === job.id ? { ...j, pct } : j))),
      });
      onChange({ images, video: urlStr });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading((u) => u.filter((j) => j.id !== job.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, video]);

  const removeImage = (i) => setImages(images.filter((_, idx) => idx !== i));

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleImageFiles(e.dataTransfer.files);
  };

  // reorder by drag
  const onCardDragStart = (i) => { dragIndex.current = i; };
  const onCardDrop = (i) => {
    const from = dragIndex.current;
    if (from == null || from === i) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    setImages(next);
  };

  return (
    <div className="uploader">
      {error && <div className="form-error">{error}</div>}

      {/* Image dropzone */}
      <div
        className="uploader__zone"
        onClick={() => imgInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={imgInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { handleImageFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="uploader__zone-inner">
          <strong>Add photos</strong>
          <span>Tap to choose from gallery, or drag &amp; drop. Up to 25MB each — large photos are auto-compressed. First photo is the main image.</span>
        </div>
      </div>

      {/* Thumbnails */}
      {(images.length > 0 || uploading.some((u) => u.kind === 'image')) && (
        <div className="uploader__grid">
          {images.map((src, i) => (
            <div
              key={src + i}
              className={`uploader__thumb ${i === 0 ? 'is-main' : ''}`}
              draggable
              onDragStart={() => onCardDragStart(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onCardDrop(i)}
            >
              <img src={src} alt="" />
              {i === 0 && <span className="uploader__badge">Main</span>}
              <button type="button" className="uploader__remove" onClick={() => removeImage(i)} aria-label="Remove">×</button>
            </div>
          ))}
          {uploading.filter((u) => u.kind === 'image').map((job) => (
            <div className="uploader__thumb uploader__thumb--loading" key={job.id}>
              <div className="uploader__progress">
                <div className="uploader__progress-bar" style={{ width: `${job.pct}%` }} />
                <span>{job.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video */}
      <div className="uploader__video">
        <input
          ref={vidInput}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => { handleVideoFile(e.target.files); e.target.value = ''; }}
        />
        {video ? (
          <div className="uploader__video-preview">
            <video src={video} controls preload="metadata" />
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setVideo('')}>Remove video</button>
          </div>
        ) : uploading.some((u) => u.kind === 'video') ? (
          (() => {
            const job = uploading.find((u) => u.kind === 'video');
            return (
              <div className="uploader__progress uploader__progress--wide">
                <div className="uploader__progress-bar" style={{ width: `${job.pct}%` }} />
                <span>Uploading video… {job.pct}%</span>
              </div>
            );
          })()
        ) : (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => vidInput.current?.click()}>
            + Add a video (optional)
          </button>
        )}
      </div>
    </div>
  );
}
