import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { Check } from '../components/Icons.jsx';

const SERVICES = [
  { value: 'Draping consultation', label: 'Draping consultation', blurb: 'One-on-one guidance on the drape that suits your saree and occasion.' },
  { value: 'Custom stitching & fitting', label: 'Custom stitching & fitting', blurb: 'Blouse and suit stitching, tailored to your measurements.' },
  { value: 'Styling session', label: 'Styling session', blurb: 'Put together a full look — pairing, layering, accessories.' },
  { value: 'Bridal trial', label: 'Bridal trial', blurb: 'A dedicated trial run for wedding-day looks, in the studio.' },
];

const TIME_SLOTS = ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];

// Soft-focus saree photos that drift behind the hero.
const HERO_BG = [
  '/products/mauve-kalamkari-peacock-1.jpg',
  '/products/maroon-patola-ikat-1.jpg',
  '/products/green-gold-leheriya-1.jpg',
  '/products/magenta-emerald-set-1.jpg',
];

function minDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatRange(start, end) {
  if (!start) return null;
  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!end || start === end) return fmt(start);
  return `${fmt(start)} — ${fmt(end)}`;
}

export default function Studio() {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [bgIndex, setBgIndex] = useState(0);
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

  // Pull the admin-controlled event/exhibition info (may be null).
  useEffect(() => {
    api.getStudioEvent().then(setEvent).catch(() => {});
  }, []);

  // Slow crossfade between saree backgrounds.
  useEffect(() => {
    const id = setInterval(() => setBgIndex((i) => (i + 1) % HERO_BG.length), 4500);
    return () => clearInterval(id);
  }, []);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="success__mark"><Check width="42" height="42" /></div>
            <span className="eyebrow">Appointment requested</span>
            <h1>See you at the studio</h1>
            <p style={{ color: 'var(--ink-soft)' }}>
              We’ve received your request and will confirm by phone or email shortly.
            </p>
            <div className="order-box">
              <div className="summary-row"><span>Service</span><span>{booked.service}</span></div>
              <div className="summary-row"><span>Date</span><span>{new Date(booked.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
              <div className="summary-row"><span>Time</span><span>{booked.preferredTime}</span></div>
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

  const eventDates = event && formatRange(event.startDate, event.endDate);

  return (
    <>
      {/* ANIMATED SAREE HERO */}
      <section className="studio-hero">
        <div className="studio-hero__bg">
          {HERO_BG.map((src, i) => (
            <div
              key={src}
              className={`studio-hero__layer ${i === bgIndex ? 'is-active' : ''}`}
              style={{ backgroundImage: `url(${event?.heroImage && i === 0 ? event.heroImage : src})` }}
            />
          ))}
          <div className="studio-hero__scrim" />
        </div>
        <div className="container studio-hero__inner">
          <span className="eyebrow reveal reveal--1" style={{ color: 'var(--gold-soft)' }}>
            {event?.location || 'Lucknow, Uttar Pradesh'}
          </span>
          <h1 className="reveal reveal--2">{event?.title || 'Visit the Sutaara Studio'}</h1>
          {(event?.subtitle) && <p className="studio-hero__sub reveal reveal--3">{event.subtitle}</p>}
          <div className="studio-hero__cta reveal reveal--4">
            <a href="#book" className="btn btn--gold">Book an appointment</a>
          </div>
        </div>
      </section>

      {/* EVENT / EXHIBITION INFO (admin-controlled) */}
      {event && (event.description || eventDates || event.address) && (
        <section className="section--tight">
          <div className="container">
            <div className="studio-info reveal-item">
              {event.description && (
                <div className="studio-info__body">
                  <span className="eyebrow">About the event</span>
                  <h2>{event.title}</h2>
                  <hr className="zari zari--short" />
                  <p className="studio-info__desc">{event.description}</p>
                </div>
              )}
              <div className="studio-info__facts">
                {eventDates && (
                  <div className="studio-fact"><span className="studio-fact__k">Dates</span><span className="studio-fact__v">{eventDates}</span></div>
                )}
                <div className="studio-fact"><span className="studio-fact__k">Location</span><span className="studio-fact__v">{event.location}</span></div>
                {event.address && (
                  <div className="studio-fact"><span className="studio-fact__k">Address</span><span className="studio-fact__v">{event.address}</span></div>
                )}
                {event.hours && (
                  <div className="studio-fact"><span className="studio-fact__k">Hours</span><span className="studio-fact__v">{event.hours}</span></div>
                )}
                {event.phone && (
                  <div className="studio-fact"><span className="studio-fact__k">Phone</span><span className="studio-fact__v">{event.phone}</span></div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BOOKING FORM */}
      <section className="section--tight" id="book">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">By appointment</span>
            <h2>Book your studio visit</h2>
            <hr className="zari zari--short" />
          </div>
          <form className="checkout" onSubmit={submit}>
            <div>
              {error && <div className="form-error">{error}</div>}

              <div className="checkout__panel">
                <h3>Choose a service</h3>
                <div className="studio-services">
                  {SERVICES.map((s) => (
                    <label key={s.value} className={`radio-card ${form.service === s.value ? 'active' : ''}`}>
                      <input type="radio" name="service" checked={form.service === s.value} onChange={() => setForm((f) => ({ ...f, service: s.value }))} />
                      <div><strong>{s.label}</strong><span>{s.blurb}</span></div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="checkout__panel">
                <h3>Pick a date &amp; time</h3>
                <div className="field__row">
                  <div className="field">
                    <label>Date</label>
                    <input type="date" min={minDate()} value={form.preferredDate} onChange={set('preferredDate')} required />
                  </div>
                  <div className="field">
                    <label>Time slot</label>
                    <select className="select" value={form.preferredTime} onChange={set('preferredTime')} required>
                      <option value="" disabled>Choose a time</option>
                      {TIME_SLOTS.map((t) => (<option key={t} value={t}>{t}</option>))}
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
              <h3>{event?.title || 'Sutaara Studio'}</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {event?.subtitle || 'Visit us for a personal draping consultation, a custom fitting, or a full styling session — by appointment.'}
              </p>
              <div className="summary-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <span>Location</span><span>{event?.location || 'Lucknow, UP'}</span>
              </div>
              <div className="summary-row">
                <span>Hours</span><span>{event?.hours || '11 AM – 7 PM'}</span>
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
