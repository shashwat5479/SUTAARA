import { useState } from 'react';

// Google only ever gives us name + email + a photo — no phone number, which
// the store needs for delivery. This is the small extra step shown right
// after a first-time Google sign-in, inside the same gift-card shell, so it
// reads as "one more layer to unwrap" rather than a separate interruption.
export default function GoogleDetailsStep({ user, onSave, onSkip, busy }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      setError('Enter a 10-digit phone number');
      return;
    }
    try {
      await onSave(phone.trim());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="gift-details">
      {user?.avatar ? (
        <img className="gift-details__avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        <div className="gift-details__avatar gift-details__avatar--fallback">
          {user?.name?.[0]?.toUpperCase() || '✦'}
        </div>
      )}
      <h2>Welcome, {user?.name?.split(' ')[0]}</h2>
      <p className="sub">One last layer to unwrap — where should we deliver your Sutaara pieces?</p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field">
          <label>Phone number</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            autoFocus
          />
        </div>
        <button className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Saving…' : 'Continue to Sutaara'}
        </button>
      </form>
      <button type="button" className="gift-details__skip" onClick={onSkip}>
        Skip for now
      </button>
    </div>
  );
}
