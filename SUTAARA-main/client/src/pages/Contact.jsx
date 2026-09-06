import { useState } from 'react';
import { Link } from 'react-router-dom';

const CARE_EMAIL = 'care@sutaara.com';

export default function Contact() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', country: '', city: '', state: '', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    // Compose a pre-filled email to Sutaara with the enquiry.
    const subject = encodeURIComponent(`Website enquiry from ${form.firstName} ${form.lastName}`.trim());
    const body = encodeURIComponent(
      `Name: ${form.firstName} ${form.lastName}\n` +
      `Email: ${form.email}\n` +
      `Phone: ${form.phone}\n` +
      `Location: ${[form.city, form.state, form.country].filter(Boolean).join(', ')}\n\n` +
      `Message:\n${form.message}`
    );
    window.location.href = `mailto:${CARE_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="page-head">
        <h1>Contact Us</h1>
        <div className="crumbs"><Link to="/">Home</Link> / <span>Contact</span></div>
      </div>
      <section className="section--tight">
        <div className="container">
          <div className="contact">
            <div className="contact__intro">
              <p className="policy__lead">
                If you have any questions regarding our work, your order, or you'd like to collaborate with
                us, our team would love to hear from you.
              </p>
              <ul className="contact__details">
                <li><b>Email:</b> <a href={`mailto:${CARE_EMAIL}`}>{CARE_EMAIL}</a></li>
                <li><b>WhatsApp / Phone:</b> <a href="https://wa.me/919569659272" target="_blank" rel="noreferrer">9569659272</a></li>
                <li><b>Studio:</b> Lucknow, Uttar Pradesh</li>
              </ul>
              <p className="small">For order-related queries, please keep your Order ID handy so we can assist you quickly. We reply through the week, except on Sundays and public holidays.</p>
            </div>

            <form className="contact__form" onSubmit={submit}>
              <h2>Write to us</h2>
              <div className="field__row">
                <div className="field"><label>First name *</label><input value={form.firstName} onChange={set('firstName')} required /></div>
                <div className="field"><label>Last name *</label><input value={form.lastName} onChange={set('lastName')} required /></div>
              </div>
              <div className="field__row">
                <div className="field"><label>Email id *</label><input type="email" value={form.email} onChange={set('email')} required /></div>
                <div className="field"><label>Number *</label><input value={form.phone} onChange={set('phone')} required /></div>
              </div>
              <div className="field__row">
                <div className="field"><label>Country</label><input value={form.country} onChange={set('country')} /></div>
                <div className="field"><label>City</label><input value={form.city} onChange={set('city')} /></div>
                <div className="field"><label>State</label><input value={form.state} onChange={set('state')} /></div>
              </div>
              <div className="field"><label>Message *</label><textarea rows="5" value={form.message} onChange={set('message')} required /></div>
              <p className="small">* mandatory field</p>
              <button className="btn btn--primary" type="submit">Send message</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
