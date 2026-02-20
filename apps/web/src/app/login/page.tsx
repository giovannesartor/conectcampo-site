'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Theme toggle floating - desktop */}
      <div className="hidden lg:block fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <Logo size="lg" showText={false} href="/" />
          </div>
          <div className="text-3xl font-bold text-white mb-4">
            Conect<span className="text-brand-300">Campo</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Acesse sua conta e gerencie suas operações de crédito
          </h2>
          <p className="mt-4 text-brand-200">
            O marketplace que conecta o agro ao crédito certo.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo + theme toggle */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Logo size="sm" href="/" />
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Entrar
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-medium text-brand-600 hover:text-brand-500">
              Cadastre-se
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-500">
                Esqueceu sua senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
