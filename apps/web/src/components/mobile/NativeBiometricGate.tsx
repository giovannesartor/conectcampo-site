'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LockKeyhole, ScanFace } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { isNativeApp } from '@/lib/native-platform';
import { authenticateNativeUser, isBiometricLockEnabled } from '@/lib/native-biometric';

const RELOCK_AFTER_MS = 15_000;

export function NativeBiometricGate() {
  const { user, logout } = useAuth();
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    if (!user || !isBiometricLockEnabled(user.id)) {
      setLocked(false);
      return;
    }
    setLocked(true);
    setAuthenticating(true);
    try {
      await authenticateNativeUser();
      setLocked(false);
    } catch {
      setLocked(true);
    } finally {
      setAuthenticating(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isNativeApp() || !user) {
      setLocked(false);
      return;
    }

    let disposed = false;
    let removeAppListener: (() => void) | undefined;

    if (isBiometricLockEnabled(user.id)) void unlock();

    void import('@capacitor/app').then(({ App }) => App.addListener('appStateChange', ({ isActive }) => {
      if (disposed) return;
      if (!isActive) {
        backgroundedAt.current = Date.now();
        return;
      }
      const elapsed = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
      backgroundedAt.current = null;
      if (elapsed >= RELOCK_AFTER_MS && isBiometricLockEnabled(user.id)) void unlock();
    })).then((handle) => {
      if (disposed) void handle.remove();
      else removeAppListener = () => { void handle.remove(); };
    }).catch(() => {});

    const handlePreference = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; enabled: boolean }>).detail;
      if (detail?.userId !== user.id) return;
      if (!detail.enabled) setLocked(false);
    };
    window.addEventListener('conectcampo:biometric-preference', handlePreference);

    return () => {
      disposed = true;
      removeAppListener?.();
      window.removeEventListener('conectcampo:biometric-preference', handlePreference);
    };
  }, [unlock, user]);

  if (!locked || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-brand-950 px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] border border-white/10 bg-white/10 shadow-2xl shadow-black/25">
          <LockKeyhole className="h-9 w-9 text-brand-200" />
        </span>
        <h1 className="mt-6 text-2xl font-black tracking-tight">ConectCampo protegido</h1>
        <p className="mt-2 text-sm leading-6 text-brand-100/80">
          Confirme sua identidade para voltar à sua conta.
        </p>
        <button
          type="button"
          onClick={() => { void unlock(); }}
          disabled={authenticating}
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 font-bold text-brand-900 disabled:opacity-60"
        >
          <ScanFace className="h-5 w-5" />
          {authenticating ? 'Verificando…' : 'Desbloquear com biometria'}
        </button>
        <button
          type="button"
          onClick={() => { void logout(); }}
          className="mt-3 min-h-11 w-full rounded-xl text-sm font-semibold text-brand-100/80 hover:bg-white/5 hover:text-white"
        >
          Sair desta conta
        </button>
      </div>
    </div>
  );
}
