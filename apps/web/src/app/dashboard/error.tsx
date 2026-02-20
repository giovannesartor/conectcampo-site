'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30 mb-5">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Erro no Dashboard
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Não foi possível carregar esta página. Tente novamente ou volte ao painel principal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link href="/dashboard" className="btn-ghost flex items-center justify-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
