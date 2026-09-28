'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { GOOGLE_REGISTRATION_KEY, isNativeGoogleEnvironment, loadGoogleIdentity, nativeGoogle, supportsNativeGoogle } from '@/lib/google-auth';

export function GoogleSignInButton({ currentPassword, onLinked }: { currentPassword?: string; onLinked?: () => void } = {}) {
  const container = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const linking = !!onLinked;
  const options = useRef({ currentPassword, onLinked });
  options.current = { currentPassword, onLinked };
  const [config, setConfig] = useState<{ available: boolean; clientId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const { setUserFromData } = useAuth();
  const router = useRouter();
  const enabled = !linking || !!currentPassword;

  useEffect(() => {
    mounted.current = true;
    if (!isNativeGoogleEnvironment() || supportsNativeGoogle()) void api.get('/auth/google/config').then(({ data }) => { if (mounted.current) setConfig(data); }).catch(() => undefined);
    return () => { mounted.current = false; };
  }, []);

  const complete = useCallback(async (challengeId: string, credential: string) => {
    if (busyRef.current || !mounted.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      if (linking) {
        await api.post('/auth/google/link', { challengeId, credential, currentPassword: options.current.currentPassword });
        options.current.onLinked?.();
      } else {
        const { data } = await api.post('/auth/google/authenticate', { challengeId, credential });
        if (data.registrationRequired) {
          sessionStorage.removeItem('conectcampo.apple.pendingRegistration');
          sessionStorage.setItem(GOOGLE_REGISTRATION_KEY, JSON.stringify({ token: data.registrationToken, email: data.email, name: data.name, expiresAt: Date.now() + 15 * 60_000 }));
          window.location.assign('/register?google=1');
          return;
        }
        const cookieOptions = { sameSite: 'strict' as const, secure: true };
        Cookies.set('accessToken', data.accessToken, { ...cookieOptions, expires: 1 });
        Cookies.set('refreshToken', data.refreshToken, { ...cookieOptions, expires: 7 });
        sessionStorage.removeItem(GOOGLE_REGISTRATION_KEY);
        localStorage.setItem('conectcampo.auth.provider', 'GOOGLE');
        setUserFromData(data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Não foi possível continuar com Google.');
    } finally { busyRef.current = false; if (mounted.current) { setBusy(false); setRevision(value => value + 1); } }
  }, [linking, router, setUserFromData]);

  useEffect(() => {
    if (!config?.available || !enabled || isNativeGoogleEnvironment()) return;
    let active = true;
    const element = container.current;
    async function prepare() {
      try {
        const [identity, { data }] = await Promise.all([loadGoogleIdentity(), api.post(`/auth/google/${linking ? 'link/' : ''}challenge`)]);
        if (!active || !element) return;
        identity.initialize({ client_id: config!.clientId, nonce: data.nonce, ux_mode: 'popup', auto_select: false, callback: response => { if (active) void complete(data.challengeId, response.credential); } });
        element.replaceChildren();
        identity.renderButton(element, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', locale: 'pt_BR', width: Math.min(360, element.clientWidth || 280) });
      } catch (err: any) { if (active) setError(err?.message ?? 'Google indisponível no momento.'); }
    }
    void prepare();
    const refresh = window.setInterval(() => { if (document.visibilityState === 'visible' && !busyRef.current) void prepare(); }, 240000);
    return () => { active = false; window.clearInterval(refresh); element?.replaceChildren(); };
  }, [config, complete, linking, enabled, revision]);

  async function nativeSignIn() {
    if (busyRef.current) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.post(`/auth/google/${linking ? 'link/' : ''}challenge`);
      const { idToken } = await nativeGoogle.signIn({ nonce: data.nonce });
      await complete(data.challengeId, idToken);
    } catch (err: any) { if (err?.code !== 'SIGN_IN_CANCELLED') setError(err?.response?.data?.message ?? err?.message ?? 'Não foi possível entrar com Google.'); }
    finally { setBusy(false); }
  }

  if (!config?.available) return null;
  return <div className="mt-5 space-y-3">
    {!linking && <div className="flex items-center gap-3 text-xs text-gray-500"><span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />ou continue com Google<span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" /></div>}
    {isNativeGoogleEnvironment() ? <button type="button" disabled={busy || !enabled} onClick={() => void nativeSignIn()} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 disabled:opacity-50"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.16v5h6.6c3.86-3.56 6.09-8.8 6.09-14.66Z"/><path fill="#34A853" d="M24 44c5.5 0 10.12-1.82 13.5-4.88l-6.6-5c-1.83 1.23-4.17 1.96-6.9 1.96-5.3 0-9.8-3.58-11.4-8.4H5.8v5.16A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.6 27.68a12 12 0 0 1 0-7.36v-5.16H5.8a20 20 0 0 0 0 17.68Z"/><path fill="#EA4335" d="M24 11.92c3 0 5.7 1.04 7.82 3.08l5.86-5.86A19.55 19.55 0 0 0 24 4 20 20 0 0 0 5.8 15.16l6.8 5.16c1.6-4.82 6.1-8.4 11.4-8.4Z"/></svg>{busy ? 'Conectando…' : 'Continuar com Google'}</button> : <div ref={container} className={busy ? 'pointer-events-none opacity-50' : ''} aria-busy={busy} />}
    {linking && !enabled && <p className="text-sm text-gray-500">Informe sua senha para preparar a confirmação Google.</p>}
    {error && <div role="alert" className="text-sm text-red-600 dark:text-red-400">{error}<button type="button" className="ml-2 underline" onClick={() => { setError(''); setRevision(value => value + 1); }}>Tentar novamente</button></div>}
  </div>;
}
