'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    cpf?: string;
  }) => Promise<void>;
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
    Cookies.set('accessToken', data.accessToken, { expires: 1 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    setUser(data.user);
  }

  async function register(formData: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    cpf?: string;
  }) {
    const { data } = await api.post('/auth/register', formData);
    Cookies.set('accessToken', data.accessToken, { expires: 1 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
    setUser(data.user);
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
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
