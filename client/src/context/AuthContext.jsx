import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load if a token is present
  useEffect(() => {
    const token = localStorage.getItem('sutaara_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('sutaara_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (res) => {
    localStorage.setItem('sutaara_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    return persist(res);
  }, []);

  // Registering no longer signs you in. The account is created unverified and
  // the server emails a code; the caller shows the verify step and calls
  // verifyEmail() with the code, which is what actually returns a session.
  const register = useCallback(async (payload) => {
    return api.register(payload);
  }, []);

  const verifyEmail = useCallback(async (email, code) => {
    const res = await api.verifyEmail(email, code);
    return persist(res);
  }, []);

  const resendCode = useCallback(async (email) => api.resendCode(email), []);

  const loginWithGoogle = useCallback(async (credential) => {
    const res = await api.googleLogin(credential);
    return persist(res);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sutaara_token');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const res = await api.updateMe(payload);
    setUser(res.user);
    return res.user;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        verifyEmail,
        resendCode,
        logout,
        updateProfile,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
