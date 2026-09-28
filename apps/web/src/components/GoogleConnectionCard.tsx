'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GoogleSignInButton } from './GoogleSignInButton';
import { isNativeGoogleEnvironment, supportsNativeGoogle } from '@/lib/google-auth';

export function GoogleConnectionCard() {
  const [connection, setConnection] = useState<{ linked: boolean; available: boolean; passwordEnabled: boolean } | null>(null);
  const [password, setPassword] = useState('');
  useEffect(() => { void api.get('/auth/google/connection').then(({ data }) => setConnection(data)).catch(() => undefined); }, []);
  return <section className="card p-6">
    <h2 className="font-semibold">Acesso com Google</h2>
    <p className="mt-2 text-sm leading-6 text-gray-500">{connection?.linked ? 'Google vinculado. Seus documentos e operações permanecem nesta mesma conta.' : 'Vincule sua conta Google para entrar sem criar outro cadastro. Endereços Gmail cadastrados por senha não são vinculados automaticamente.'}</p>
    {connection && !connection.passwordEnabled && <p className="mt-3 text-sm text-gray-500">Você usa acesso social sem senha própria. Para vincular outro provedor ou confirmar a exclusão por senha, <a href="/forgot-password" className="font-semibold text-brand-700 underline dark:text-brand-300">defina uma senha por e-mail</a>.</p>}
    {connection && !connection.linked && connection.available && connection.passwordEnabled && (!isNativeGoogleEnvironment() || supportsNativeGoogle()) && <div className="mt-4">
      <label htmlFor="google-link-password" className="label">Confirme a senha atual da ConectCampo</label>
      <input id="google-link-password" type="password" autoComplete="current-password" className="input" value={password} onChange={event => setPassword(event.target.value)} />
      <GoogleSignInButton currentPassword={password} onLinked={() => { setPassword(''); setConnection({ ...connection, linked: true }); }} />
    </div>}
    {connection && !connection.linked && isNativeGoogleEnvironment() && !supportsNativeGoogle() && <p className="mt-3 text-sm text-gray-500">Atualize o aplicativo para entrar com Google. Seu acesso atual continua funcionando.</p>}
  </section>;
}
