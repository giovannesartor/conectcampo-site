'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

/**
 * Componente compartilhado usado pelas rotas de callback OAuth2 do QuantoVale:
 *   /callback
 *   /oauth/callback
 */
export function QuantovaleCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg('Autorização negada. Você pode tentar novamente nas configurações.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('Código de autorização não encontrado.');
      return;
    }

    async function exchange() {
      try {
        await api.post('/quantovale/exchange', {
          code,
          redirectUri: `${window.location.origin}/callback`,
        });
        setStatus('success');
        setTimeout(() => router.replace('/dashboard/valuation'), 1500);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Erro ao conectar com o QuantoVale.';
        setStatus('error');
        setErrorMsg(msg);
      }
    }

    exchange();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conectando ao QuantoVale...
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Aguarde um momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              QuantoVale conectado!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecionando para seus valuations...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Erro na conexão</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{errorMsg}</p>
            <button
              onClick={() => router.replace('/dashboard/settings')}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
            >
              Voltar para Configurações
            </button>
          </>
        )}
      </div>
    </div>
  );
}
