import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { Check } from '../components/Icons.jsx';

const SERVICES = [
  {
    value: 'Draping consultation',
    label: 'Draping consultation',
    blurb: 'One-on-one guidance on the drape that suits your saree and occasion.',
  },
  {
    value: 'Custom stitching & fitting',
    label: 'Custom stitching & fitting',
    blurb: 'Blouse and suit stitching, tailored to your measurements.',
  },
  {
    value: 'Styling session',
    label: 'Styling session',
    blurb: 'Put together a full look — pairing, layering, accessories.',
  },
  {
    value: 'Bridal trial',
    label: 'Bridal trial',
    blurb: 'A dedicated trial run for wedding-day looks, in the studio.',
  },
];

const TIME_SLOTS = ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

function minDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function Studio() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    service: SERVICES[0].value,
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.preferredDate || !form.preferredTime) {
      setError('Please choose a date and a time slot');
      return;
    }
    setBusy(true);
    try {
      const appointment = await api.createAppointment(form);
      setBooked(appointment);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (booked) {
    return (
      <section className="section">
        <div className="container">
          <div className="success">
            <div className="success__mark">
              <Check width="42" height="42" />
            </div>
            <span className="eyebrow">Appointment requested</span>
            <h1>See you at the studio</h1>
            <p style={{ color: 'var(--ink-soft)' }}>
              We’ve received your request and will confirm by phone or email shortly.
            </p>

            <div className="order-box">
              <div className="summary-row">
                <span>Service</span>
                <span>{booked.service}</span>
              </div>
              <div className="summary-row">
                <span>Date</span>
                <span>{new Date(booked.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="summary-row">
                <span>Time</span>
                <span>{booked.preferredTime}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn btn--primary">Continue browsing</Link>
              {user && <Link to="/account" className="btn btn--ghost">My account</Link>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1>The Studio</h1>
        <div className="crumbs">
          <Link to="/">Home</Link> / <span>Studio</span>
        </div>
      </div>

      <section className="section--tight">
        <div className="container">
          <form className="checkout" onSubmit={submit}>
            <div>
              {error && <div className="form-error">{error}</div>}

              <div className="checkout__panel">
                <h3>Choose a service</h3>
                <div className="studio-services">
                  {SERVICES.map((s) => (
                    <label key={s.value} className={`radio-card ${form.service === s.value ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="service"
                        checked={form.service === s.value}
                        onChange={() => setForm((f) => ({ ...f, service: s.value }))}
                      />
                      <div>
                        <strong>{s.label}</strong>
                        <span>{s.blurb}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="checkout__panel">
                <h3>Pick a date &amp; time</h3>
                <div className="field__row">
                  <div className="field">
                    <label>Date</label>
                    <input
                      type="date"
                      min={minDate()}
                      value={form.preferredDate}
                      onChange={set('preferredDate')}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Time slot</label>
                    <select className="select" value={form.preferredTime} onChange={set('preferredTime')} required>
                      <option value="" disabled>Choose a time</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Anything we should know? (optional)</label>
                  <textarea rows={3} value={form.notes} onChange={set('notes')} />
                </div>
              </div>

              <div className="checkout__panel">
                <h3>Your details</h3>
                <div className="field">
                  <label>Full name</label>
                  <input value={form.name} onChange={set('name')} required />
                </div>
                <div className="field__row">
                  <div className="field">
                    <label>Phone</label>
                    <input value={form.phone} onChange={set('phone')} required inputMode="tel" />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={set('email')} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <h3>Sutaara Studio</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Visit us in Prayagraj for a personal draping consultation, a custom fitting,
                or a full styling session — by appointment.
              </p>
              <div className="summary-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <span>Location</span>
                <span>Prayagraj, UP</span>
              </div>
              <div className="summary-row">
                <span>Hours</span>
                <span>11 AM – 7 PM</span>
              </div>
              <button className="btn btn--primary btn--block" style={{ marginTop: 18 }} disabled={busy}>
                {busy ? 'Requesting…' : 'Request appointment'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}