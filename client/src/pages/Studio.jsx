import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { Check } from '../components/Icons.jsx';

const SERVICES = [
  {
    value: 'Explore the Collection',
    label: 'Explore the Collection',
    blurb: 'Visit our studio to discover, feel and shop our latest sarees and handloom collections in person.',
    num: '01',
  },
  {
    value: 'Saree Draping Consultation',
    label: 'Saree Draping Consultation',
    blurb: 'Try different drapes and find the one that works best for your saree, occasion and personal style.',
    num: '02',
  },
  {
    value: 'Styling Session',
    label: 'Styling Session',
    blurb: 'Get personalised suggestions on saree pairing, blouse options, accessories and putting together your complete look.',
    num: '03',
  },
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
    preferredDay: '',
    preferredMonth: '',
    preferredYear: '',
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

          {/* Intro copy */}
          <div className="studio-intro">
            <div className="section-head">
              <span className="eyebrow">By appointment</span>
              <h2>Come visit our studio</h2>
              <hr className="zari zari--short" />
              <p className="studio-intro__sub">
                Explore the collection, experience the fabrics and find your perfect look.
              </p>
            </div>

            {/* Numbered services — read-only, above the booking form */}
            <div className="studio-numbered">
              {SERVICES.map((s) => (
                <div key={s.value} className="studio-numbered__item">
                  <span className="studio-numbered__num">{s.num}</span>
                  <div>
                    <strong>{s.label}</strong>
                    <p>{s.blurb}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form className="checkout" onSubmit={submit} style={{ marginTop: 40 }}>
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
                <div className="field">
                  <label>Date</label>
                  <div className="studio-date-row">
                    <select
                      className="select"
                      value={form.preferredDay || ''}
                      onChange={(e) => setForm((f) => ({ ...f, preferredDay: e.target.value, preferredDate: f.preferredYear && f.preferredMonth ? `${f.preferredYear}-${f.preferredMonth}-${e.target.value}` : '' }))}
                      required
                    >
                      <option value="" disabled>Day</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <select
                      className="select"
                      value={form.preferredMonth || ''}
                      onChange={(e) => setForm((f) => ({ ...f, preferredMonth: e.target.value, preferredDate: f.preferredYear && f.preferredDay ? `${f.preferredYear}-${e.target.value}-${f.preferredDay}` : '' }))}
                      required
                    >
                      <option value="" disabled>Month</option>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                      ))}
                    </select>
                    <select
                      className="select"
                      value={form.preferredYear || ''}
                      onChange={(e) => setForm((f) => ({ ...f, preferredYear: e.target.value, preferredDate: f.preferredMonth && f.preferredDay ? `${e.target.value}-${f.preferredMonth}-${f.preferredDay}` : '' }))}
                      required
                    >
                      <option value="" disabled>Year</option>
                      {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field" style={{ marginTop: 14 }}>
                  <label>Time slot</label>
                  <div className="studio-time-grid">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`studio-time-btn ${form.preferredTime === t ? 'active' : ''}`}
                        onClick={() => setForm((f) => ({ ...f, preferredTime: t }))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field" style={{ marginTop: 14 }}>
                  <label>Anything we should know? (optional)</label>
                  <textarea className="textarea" rows={3} value={form.notes} onChange={set('notes')} placeholder="e.g. attending a wedding, need help with a Banarasi drape…" />
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
                {event?.subtitle || 'Visit our studio to experience the Sutaara collection in person. Browse, try and discover your perfect look with personalised styling guidance.'}
              </p>
              <div className="summary-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                <span>Location</span><span>{event?.location || 'Vipul Khand, Gomti Nagar, Lucknow'}</span>
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
