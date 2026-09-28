import axios from 'axios';
import Cookies from 'js-cookie';

// Uses relative path so Next.js rewrites proxy to the backend.
// Works in any environment without baking URLs at build time.
const API_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequest: Promise<{ accessToken: string; refreshToken: string }> | null = null;

// Interceptor: adicionar token
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: refresh token em caso de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Public auth failures must stay on the form, not refresh/reload the page.
    const publicAuth = /^\/auth\/(login|register|refresh|forgot-password|reset-password|social)/.test(originalRequest?.url ?? '');
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !publicAuth) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Token rotation is single-flight: simultaneous dashboard requests must
        // not replay the same refresh token and revoke a valid session.
        if (!refreshRequest) {
          refreshRequest = axios.post(`${API_URL}/auth/refresh`, { refreshToken })
            .then(({ data }) => data)
            .finally(() => { refreshRequest = null; });
        }
        const data = await refreshRequest;

        const options = { sameSite: 'strict' as const, secure: typeof window !== 'undefined' && window.location.protocol === 'https:' };
        Cookies.set('accessToken', data.accessToken, { ...options, expires: 1 });
        Cookies.set('refreshToken', data.refreshToken, { ...options, expires: 7 });

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
