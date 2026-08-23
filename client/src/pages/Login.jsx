import { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import GoogleDetailsStep from '../components/GoogleDetailsStep.jsx';
import AuthShowcase from '../components/AuthShowcase.jsx';
import VerifyEmailStep from '../components/VerifyEmailStep.jsx';

export default function Login() {
  const { login, loginWithGoogle, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // set once Google login succeeds but phone is missing
  // Set when the password was right but the address was never verified.
  const [verifyEmailAddr, setVerifyEmailAddr] = useState('');

  const goAfterLogin = (user) => {
    toast(`Welcome back, ${user.name.split(' ')[0]}`);
    navigate(user.role === 'admin' ? '/admin' : from, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      goAfterLogin(user);
    } catch (err) {
      // Password was right but the address was never verified — the server
      // has already emailed a fresh code, so go straight to the code step
      // rather than showing this as a failure.
      if (err.status === 403 && err.data?.needsVerification) {
        setVerifyEmailAddr(err.data.email);
        setBusy(false);
        return;
      }
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
        goAfterLogin(user);
      }
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginWithGoogle]);

  const saveDetails = async (phone) => {
    setBusy(true);
    try {
      const user = await updateProfile({ phone });
      goAfterLogin(user);
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
            setVerifyEmailAddr('');
            goAfterLogin(user);
          }}
        />
      ) : pendingUser ? (
        <GoogleDetailsStep
          user={pendingUser}
          busy={busy}
          onSave={saveDetails}
          onSkip={() => goAfterLogin(pendingUser)}
        />
      ) : (
        <div className="auth-wrap">
          <h1>Sign in</h1>
          <p className="sub">Welcome back to Sutaara</p>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="auth-divider"><span>or</span></div>
          <div className="auth-google">
            <GoogleButton onCredential={handleGoogle} text="signin_with" />
          </div>
          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
          <p className="sub" style={{ marginTop: 18, fontSize: '0.78rem' }}>
            Demo admin — admin@sutaara.in / admin123
          </p>
        </div>
      )}
    </AuthShowcase>
  );
}
