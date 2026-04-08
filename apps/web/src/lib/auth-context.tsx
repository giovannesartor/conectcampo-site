'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

/** Decode JWT payload without verification (client-side only). */
function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch { return null; }
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setUserFromData: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // H: warn user 5 min before session expires
  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!user || !token) return;
    const expiryMs = getTokenExpiryMs(token);
    if (!expiryMs) return;
    const warnIn = expiryMs - Date.now() - 5 * 60 * 1000;
    if (warnIn <= 0) return;
    const id = setTimeout(() => {
      toast('Sua sessão expira em 5 minutos. Salve seu trabalho.', {
        duration: 10_000,
        icon: '⏱️',
      });
    }, warnIn);
    return () => clearTimeout(id);
  }, [user]);

  async function fetchUser() {
    try {
      const { data } = await api.get('/users/me');
      setUser(data);
    } catch {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    Cookies.set('accessToken', data.accessToken, { expires: 1, sameSite: 'strict', secure: window.location.protocol === 'https:' });
    Cookies.set('refreshToken', data.refreshToken, { expires: 7, sameSite: 'strict', secure: window.location.protocol === 'https:' });
    setUser(data.user);
  }

  function setUserFromData(u: User) {
    setUser(u);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, setUserFromData, logout }}>
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
