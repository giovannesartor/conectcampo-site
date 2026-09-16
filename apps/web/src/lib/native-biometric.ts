import { Capacitor } from '@capacitor/core';

const preferenceKey = (userId: string) => `conectcampo:biometric-lock:${userId}`;

export function isBiometricLockEnabled(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(preferenceKey(userId)) === 'enabled';
}

export function setBiometricLockEnabled(userId: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) window.localStorage.setItem(preferenceKey(userId), 'enabled');
  else window.localStorage.removeItem(preferenceKey(userId));
  window.dispatchEvent(new CustomEvent('conectcampo:biometric-preference', {
    detail: { userId, enabled },
  }));
}

export async function hasNativeBiometry(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function authenticateNativeUser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
  await BiometricAuth.authenticate({
    reason: 'Confirme sua identidade para acessar o ConectCampo',
    cancelTitle: 'Cancelar',
    allowDeviceCredential: true,
    iosFallbackTitle: 'Usar código do aparelho',
  });
}
