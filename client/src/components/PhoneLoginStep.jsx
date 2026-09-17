import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const LENGTH = 6;
const RESEND_COOLDOWN = 60;

// Two-stage step: enter a mobile number and request a code, then enter the
// 6-digit code to finish signing in. Mirrors VerifyEmailStep's box UI for
// the code entry so the two flows feel identical.
export default function PhoneLoginStep({ onVerified, onCancel }) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (sent) inputs.current[0]?.focus();
  }, [sent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendPhoneOtp(phone);
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (code) => {
    setBusy(true);
    setError('');
    try {
      const user = await verifyPhoneOtp(phone, code);
      onVerified(user);
    } catch (err) {
      setError(err.message);
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (i, value) => {
    // Accept a full code pasted into any box, not just the first.
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').slice(0, LENGTH).split('');
      if (chars.length) {
        const next = Array(LENGTH).fill('');
        chars.forEach((ch, idx) => { next[idx] = ch; });
        setDigits(next);
        if (chars.length === LENGTH) submitCode(chars.join(''));
        else inputs.current[chars.length]?.focus();
      }
      return;
    }
    if (value && !/^\d$/.test(value)) return;

    const next = [...digits];
    next[i] = value;
    setDigits(next);
    if (value && i < LENGTH - 1) inputs.current[i + 1]?.focus();

    const code = next.join('');
    if (code.length === LENGTH && !code.includes('')) submitCode(code);
  };

  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const resend = async () => {
    try {
      await sendPhoneOtp(phone);
      toast('A new code is on its way');
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch (err) {
      toast(err.message);
    }
  };

  if (!sent) {
    return (
      <form className="verify-step" onSubmit={requestCode}>
        <h2>Sign in with mobile</h2>
        <p className="verify-step__lead">We'll text a 6-digit code to verify it's you.</p>
        <div className="field">
          <label>Mobile number</label>
          <div className="phone-input">
            <span className="phone-input__prefix">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              required
              autoFocus
            />
          </div>
        </div>
        {error && <p className="verify-step__error">{error}</p>}
        <button className="btn btn--primary btn--block" disabled={busy || phone.length !== 10}>
          {busy ? 'Sending…' : 'Send code'}
        </button>
        {onCancel && (
          <p className="auth-switch" style={{ marginTop: 14 }}>
            <button type="button" className="link-btn" onClick={onCancel}>
              Use a different sign-in method
            </button>
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="verify-step">
      <h2>Enter the code</h2>
      <p className="verify-step__lead">
        We sent a 6-digit code to <strong>+91 {phone}</strong>.
      </p>

      <div className="verify-step__boxes">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={onKeyDown(i)}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={LENGTH}
            disabled={busy}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && <p className="verify-step__error">{error}</p>}
      {busy && <p className="verify-step__hint">Verifying…</p>}

      <p className="verify-step__hint">
        Didn't get it?{' '}
        {cooldown > 0 ? (
          <span className="verify-step__cooldown">resend in {cooldown}s</span>
        ) : (
          <button type="button" className="linklike" onClick={resend}>
            send a new code
          </button>
        )}
        .
      </p>

      <p className="auth-switch" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="link-btn"
          onClick={() => { setSent(false); setDigits(Array(LENGTH).fill('')); setError(''); }}
        >
          Change number
        </button>
      </p>
    </div>
  );
}
