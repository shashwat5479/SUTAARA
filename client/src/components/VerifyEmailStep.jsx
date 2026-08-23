import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailStep({ email, onVerified }) {
  const { verifyEmail, resendCode } = useAuth();
  const toast = useToast();
  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (code) => {
    setBusy(true);
    setError('');
    try {
      const user = await verifyEmail(email, code);
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
        if (chars.length === LENGTH) submit(chars.join(''));
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
    if (code.length === LENGTH && !code.includes('')) submit(code);
  };

  const onKeyDown = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const resend = async () => {
    try {
      await resendCode(email);
      toast('A new code is on its way');
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <div className="verify-step">
      <h2>Check your email</h2>
      <p className="verify-step__lead">
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to finish
        creating your account.
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
        Didn't get it? Check your spam folder, or{' '}
        {cooldown > 0 ? (
          <span className="verify-step__cooldown">resend in {cooldown}s</span>
        ) : (
          <button type="button" className="linklike" onClick={resend}>
            send a new code
          </button>
        )}
        .
      </p>
    </div>
  );
}
