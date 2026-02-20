'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Algo deu errado
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            Erro: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link href="/" className="btn-ghost flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
