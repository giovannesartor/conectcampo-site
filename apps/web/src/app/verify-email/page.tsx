'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token não encontrado. Verifique o link recebido por e-mail.');
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus('success');
        setMessage(res.data?.message ?? 'E-mail confirmado com sucesso!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message ?? 'Token inválido ou expirado. Solicite um novo link.',
        );
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="h-14 w-14 text-brand-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Verificando seu e-mail...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-brand-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          E-mail confirmado com sucesso
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <Link href="/dashboard" className="btn-primary inline-block">
          Acessar plataforma
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Não foi possível verificar
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <Link href="/dashboard" className="btn-primary inline-block">
        Ir para o dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-gray-50 dark:bg-dark-bg">
      <div className="hidden lg:block fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-10 lg:justify-center">
          <Logo size="sm" href="/" />
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border p-8">
          <Suspense fallback={
            <div className="text-center">
              <Loader2 className="h-14 w-14 text-brand-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
