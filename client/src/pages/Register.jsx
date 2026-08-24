import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import GoogleDetailsStep from '../components/GoogleDetailsStep.jsx';
import AuthShowcase from '../components/AuthShowcase.jsx';
import VerifyEmailStep from '../components/VerifyEmailStep.jsx';

export default function Register() {
  const { register, loginWithGoogle, loginDemo, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  // Set once the account is created and a code has been emailed — swaps the
  // form out for the code-entry step.
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('');
  // Password sign-up is tucked behind a toggle — Google (or the demo option)
  // is the primary path in.
  const [showEmailForm, setShowEmailForm] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const goAfterAuth = (user) => {
    toast(`Welcome to Sutaara, ${user.name.split(' ')[0]}`);
    navigate('/account', { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await register(form);
      // register() no longer returns a session — the account is unverified
      // until the emailed code is entered.
      if (res?.needsVerification) {
        setVerifyEmailAddr(res.email);
        setBusy(false);
        return;
      }
      goAfterAuth(res);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleGoogle = useCallback(async (credential) => {
    setError('');
    try {
      const user = await loginWithGoogle(credential);
      if (!user.phone) {
        setPendingUser(user);
      } else {
        goAfterAuth(user);
      }
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginWithGoogle]);

  const handleDemo = async () => {
    setError('');
    setDemoBusy(true);
    try {
      const user = await loginDemo();
      goAfterAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setDemoBusy(false);
    }
  };

  const saveDetails = async (phone) => {
    setBusy(true);
    try {
      const user = await updateProfile({ phone });
      goAfterAuth(user);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShowcase>
      {verifyEmailAddr ? (
        <VerifyEmailStep
          email={verifyEmailAddr}
          onVerified={(user) => {
            if (!user.phone) setPendingUser(user);
            else goAfterAuth(user);
            setVerifyEmailAddr('');
          }}
        />
      ) : pendingUser ? (
        <GoogleDetailsStep
          user={pendingUser}
          busy={busy}
          onSave={saveDetails}
          onSkip={() => goAfterAuth(pendingUser)}
        />
      ) : (
        <div className="auth-wrap">
          <h1>Create account</h1>
          <p className="sub">Join us for early access to new pieces</p>
          {error && <div className="form-error">{error}</div>}

          <div className="auth-google">
            <GoogleButton onCredential={handleGoogle} text="signup_with" />
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--block"
            style={{ marginTop: 12 }}
            disabled={demoBusy}
            onClick={handleDemo}
          >
            {demoBusy ? 'Creating…' : 'Continue with a test email'}
          </button>
          <p className="sub" style={{ fontSize: '0.76rem', marginTop: 6 }}>
            Instant guest account with a generated email — for demos and testing.
          </p>

          {showEmailForm ? (
            <>
              <div className="auth-divider"><span>or</span></div>
              <form onSubmit={submit}>
                <div className="field">
                  <label>Full name</label>
                  <input value={form.name} onChange={set('name')} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} required />
                </div>
                <div className="field">
                  <label>Phone (optional)</label>
                  <input value={form.phone} onChange={set('phone')} inputMode="tel" />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={6}
                  />
                </div>
                <button className="btn btn--primary btn--block" disabled={busy}>
                  {busy ? 'Creating…' : 'Create account'}
                </button>
              </form>
            </>
          ) : (
            <p className="auth-switch" style={{ marginTop: 18 }}>
              Prefer a password instead?{' '}
              <button type="button" className="link-btn" onClick={() => setShowEmailForm(true)}>
                Sign up with email
              </button>
            </p>
          )}

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      )}
    </AuthShowcase>
  );
}