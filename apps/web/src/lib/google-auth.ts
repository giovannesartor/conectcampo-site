import { Capacitor, registerPlugin } from '@capacitor/core';

export const GOOGLE_REGISTRATION_KEY = 'conectcampo.google.pendingRegistration';
export const nativeGoogle = registerPlugin<{ signIn(options: { nonce: string }): Promise<{ idToken: string }> }>('ConectCampoGoogleSignIn');
export function supportsNativeGoogle() { return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('ConectCampoGoogleSignIn'); }
export function isNativeGoogleEnvironment() { return Capacitor.isNativePlatform(); }

type GoogleIdentity = {
  initialize(options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void; ux_mode: 'popup'; auto_select: boolean }): void;
  renderButton(element: HTMLElement, options: { theme: 'outline'; size: 'large'; text: 'continue_with'; shape: 'pill'; locale: string; width: number }): void;
};
declare global { interface Window { google?: { accounts?: { id?: GoogleIdentity } } } }
let scriptPromise: Promise<GoogleIdentity> | undefined;
export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!scriptPromise) scriptPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    const timer = window.setTimeout(() => fail(), 15000);
    function fail() { window.clearTimeout(timer); script.remove(); scriptPromise = undefined; reject(new Error('Não foi possível carregar Google. Verifique sua conexão e tente novamente.')); }
    script.onload = () => { window.clearTimeout(timer); window.google?.accounts?.id ? resolve(window.google.accounts.id) : fail(); };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return scriptPromise;
}
