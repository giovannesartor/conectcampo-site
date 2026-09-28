'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { APPLE_REGISTRATION_KEY, authorizeApple, supportsAppleSignIn } from '@/lib/native-apple-auth';

export function AppleSignInButton() {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { setUserFromData } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (supportsAppleSignIn()) void api.get('/auth/apple/config').then(({ data }) => setAvailable(data.available)).catch(() => undefined);
  }, []);
  if (!available) return null;

  async function signIn() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const credential = await authorizeApple();
      const { data } = await api.post('/auth/apple/authenticate', credential);
      if (data.registrationRequired) {
        sessionStorage.setItem(APPLE_REGISTRATION_KEY, JSON.stringify({ token: data.registrationToken, email: data.email, name: data.name, expiresAt: Date.now() + 15 * 60_000 }));
        window.location.assign('/register?apple=1');
        return;
      }
      const options = { sameSite: 'strict' as const, secure: true };
      Cookies.set('accessToken', data.accessToken, { ...options, expires: 1 });
      Cookies.set('refreshToken', data.refreshToken, { ...options, expires: 7 });
      sessionStorage.removeItem(APPLE_REGISTRATION_KEY);
      localStorage.setItem('conectcampo.auth.provider', 'APPLE');
      setUserFromData(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.code !== 'SIGN_IN_CANCELLED') setError(err?.response?.data?.message ?? err?.message ?? 'Não foi possível entrar com Apple.');
    } finally { setBusy(false); }
  }
  return <div className="mt-6">
    <div className="mb-4 flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />ou<span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" /></div>
    <button type="button" onClick={signIn} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-black bg-black px-4 py-3 text-base font-semibold text-white disabled:opacity-60 dark:border-white dark:bg-white dark:text-black">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17.05 12.04c.03 3.2 2.81 4.27 2.84 4.28-.02.07-.44 1.53-1.46 3.04-.89 1.3-1.81 2.6-3.27 2.63-1.43.03-1.89-.85-3.53-.85-1.63 0-2.14.82-3.5.88-1.41.05-2.48-1.42-3.38-2.71-1.84-2.65-3.24-7.48-1.35-10.76a5.25 5.25 0 0 1 4.45-2.7c1.39-.03 2.71.94 3.55.94.83 0 2.4-1.17 4.04-1 .69.03 2.64.28 3.89 2.11-.1.06-2.32 1.35-2.28 4.14ZM14.37 4.12c.75-.91 1.26-2.17 1.12-3.43-1.08.04-2.39.72-3.17 1.63-.7.8-1.31 2.1-1.14 3.33 1.21.1 2.44-.62 3.19-1.53Z" /></svg>
      {busy ? 'Conectando…' : 'Continuar com Apple'}
    </button>
    {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
  </div>;
}
