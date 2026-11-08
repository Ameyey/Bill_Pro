import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('billpro_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('billpro_token') || null);
  const [subscription, setSubscription] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user and subscription on mount
  useEffect(() => {
    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.success) {
          setUser(res.user);
          setSubscription(res.subscription);
          setCompany(res.company);
          localStorage.setItem('billpro_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [token]);

  const login = async (email, password, rememberMe = true) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      setSubscription(res.subscription);
      setCompany(res.company);
      localStorage.setItem('billpro_token', res.token);
      localStorage.setItem('billpro_user', JSON.stringify(res.user));
      if (rememberMe) {
        localStorage.setItem('billpro_remember_email', email);
      } else {
        localStorage.removeItem('billpro_remember_email');
      }
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      setSubscription(res.subscription);
      localStorage.setItem('billpro_token', res.token);
      localStorage.setItem('billpro_user', JSON.stringify(res.user));
      return res;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSubscription(null);
    setCompany(null);
    localStorage.removeItem('billpro_token');
    localStorage.removeItem('billpro_user');
  };

  const refreshMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.user);
        setSubscription(res.subscription);
        setCompany(res.company);
      }
    } catch (e) {}
  };

  const resetTrialDays = async (days = 29) => {
    try {
      const res = await api.post('/subscriptions/reset-trial', { days });
      if (res.success && res.subscription) {
        setSubscription(res.subscription);
        return res;
      }
    } catch (e) {
      setSubscription((prev) => ({
        ...prev,
        days_remaining: days,
        is_trial_active: days > 0,
        is_expired: days <= 0,
        status: days <= 0 ? 'expired' : 'active'
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        subscription,
        company,
        loading,
        login,
        register,
        logout,
        refreshMe,
        refreshSubscription: refreshMe,
        resetTrialDays,
        setSubscription,
        setCompany
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
