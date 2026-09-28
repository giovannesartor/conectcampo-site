import { Capacitor, registerPlugin } from '@capacitor/core';
import { api } from './api';

const AppleSignIn = registerPlugin<{
  signIn(options: { challengeId: string; nonce: string }): Promise<{ authorizationCode: string; name?: string }>;
  credentialState(): Promise<{ revoked: boolean }>;
}>('ConectCampoAppleSignIn');

export function supportsAppleSignIn() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('ConectCampoAppleSignIn');
}

export async function authorizeApple(purpose: 'AUTH' | 'LINK' | 'DELETE' = 'AUTH') {
  if (!supportsAppleSignIn()) throw new Error('Atualize o aplicativo para usar o login com Apple.');
  const prefix = purpose === 'AUTH' ? '' : purpose === 'LINK' ? 'link/' : 'delete/';
  const { data } = await api.post(`/auth/apple/${prefix}challenge`);
  const credential = await AppleSignIn.signIn(data);
  return { ...credential, challengeId: data.challengeId };
}

export async function appleCredentialRevoked() {
  return supportsAppleSignIn() && (await AppleSignIn.credentialState()).revoked;
}

export const APPLE_REGISTRATION_KEY = 'conectcampo.apple.pendingRegistration';
