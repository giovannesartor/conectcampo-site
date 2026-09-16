import { Capacitor } from '@capacitor/core';
import { api } from './api';

const preferenceKey = (userId: string) => `conectcampo:native-push:${userId}`;
const tokenKey = 'conectcampo:native-push-token';

export function isNativePushEnabled(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(preferenceKey(userId)) === 'enabled';
}

export async function enableNativePush(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    throw new Error('As notificações push estão disponíveis no aplicativo para iPhone.');
  }

  const { PushNotifications } = await import('@capacitor/push-notifications');
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== 'granted') {
    throw new Error('Autorize as notificações nos Ajustes do iPhone para receber alertas.');
  }

  let resolveToken!: (token: string) => void;
  let rejectToken!: (error: unknown) => void;
  const tokenPromise = new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });
  const registration = await PushNotifications.addListener('registration', (result) => {
    resolveToken(result.value);
  });
  const failure = await PushNotifications.addListener('registrationError', () => {
    rejectToken(new Error('Não foi possível registrar este iPhone para notificações.'));
  });
  const timeout = window.setTimeout(() => {
    rejectToken(new Error('O registro de notificações demorou mais que o esperado.'));
  }, 15000);

  let token: string;
  try {
    await PushNotifications.register();
    token = await tokenPromise;
  } finally {
    window.clearTimeout(timeout);
    void registration.remove();
    void failure.remove();
  }

  const { App } = await import('@capacitor/app');
  const info = await App.getInfo().catch(() => null);
  await api.post('/notifications/devices', {
    token,
    platform: 'ios',
    environment: 'PRODUCTION',
    appVersion: info?.version,
  });
  await api.patch('/notifications/preferences', { push: true });

  localStorage.setItem(tokenKey, token);
  localStorage.setItem(preferenceKey(userId), 'enabled');
}

export async function disableNativePush(userId: string, preservePreference = false): Promise<void> {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem(tokenKey);
  if (token) {
    await api.post('/notifications/devices/unregister', { token }).catch(() => undefined);
  }
  if (!preservePreference) {
    await api.patch('/notifications/preferences', { push: false }).catch(() => undefined);
    localStorage.removeItem(preferenceKey(userId));
  }
  localStorage.removeItem(tokenKey);
}

export async function syncNativePush(userId: string): Promise<void> {
  if (!isNativePushEnabled(userId)) return;
  await enableNativePush(userId);
}
