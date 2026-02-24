'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

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
