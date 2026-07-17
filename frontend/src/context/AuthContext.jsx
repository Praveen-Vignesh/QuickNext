import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState({ googleEnabled: false, razorpayEnabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ask the server what's configured rather than assuming — the same build
    // then works whether or not Google/Razorpay keys are set.
    api
      .get('/api/config')
      .then((res) => setConfig(res.data))
      .catch(() => {});

    if (!getToken()) {
      setLoading(false);
      return;
    }

    api
      .get('/api/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signUp = useCallback(async ({ name, email, password }) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithPassword = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await api.post('/api/auth/google', { credential });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const chooseRole = useCallback(async (role) => {
    const { data } = await api.post('/api/auth/role', { role });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, config, loading, signUp, loginWithPassword, loginWithGoogle, chooseRole, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
