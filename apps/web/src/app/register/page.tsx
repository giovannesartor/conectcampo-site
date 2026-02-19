'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const roles = [
  { value: 'PRODUCER', label: 'Produtor Rural', description: 'Buscar crédito para minha operação' },
  { value: 'COMPANY', label: 'Empresa / Agroindústria', description: 'Buscar crédito empresarial' },
  { value: 'FINANCIAL_INSTITUTION', label: 'Instituição Financeira', description: 'Oferecer crédito na plataforma' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PRODUCER',
    phone: '',
    cpf: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">
              Conect<span className="text-brand-200">Campo</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Crie sua conta e comece a buscar crédito em minutos
          </h2>
          <p className="mt-4 text-brand-200">
            Cadastro rápido, seguro e gratuito.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Conect<span className="text-brand-600">Campo</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Criar Conta
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500">
              Entrar
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Role selection */}
            <div>
              <label className="label">Tipo de conta</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => updateField('role', role.value)}
                    className={`text-left rounded-lg border p-3 transition-all ${
                      form.role === role.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-1 ring-brand-500'
                        : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {role.label}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {role.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="label">Nome completo</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">Telefone</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Senha</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="input pr-12"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
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

            <div className="flex items-start gap-2">
              <input
                id="lgpd"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="lgpd" className="text-xs text-gray-500 dark:text-gray-400">
                Li e concordo com os{' '}
                <Link href="#" className="text-brand-600 hover:underline">Termos de Uso</Link>{' '}
                e{' '}
                <Link href="#" className="text-brand-600 hover:underline">Política de Privacidade</Link>.
                Autorizo o tratamento dos meus dados conforme a LGPD.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
