import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Landing point for the Yahoo/Outlook OAuth redirect flow: the server
// finishes the provider exchange, then sends the browser here with either
// ?token=... (success) or ?error=... (cancelled/failed) in the URL.
export default function LoginCallback() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke guard — a token is one-time use server-side for some providers' flows, so this must run once
    ran.current = true;

    const token = params.get('token');
    const providerError = params.get('error');

    if (providerError) {
      setError(providerError);
      return;
    }
    if (!token) {
      setError('Something went wrong signing you in — please try again');
      return;
    }

    loginWithToken(token)
      .then((user) => {
        toast(`Welcome, ${user.name.split(' ')[0]}`);
        navigate(user.role === 'admin' ? '/admin' : '/account', { replace: true });
      })
      .catch(() => setError('Your sign-in link expired — please try again'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-wrap" style={{ textAlign: 'center', padding: '80px 24px' }}>
      {error ? (
        <>
          <h1>Sign in failed</h1>
          <p className="sub">{error}</p>
          <button className="btn btn--primary" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <h1>Signing you in…</h1>
          <p className="sub">Just a moment.</p>
        </>
      )}
    </div>
  );
}
