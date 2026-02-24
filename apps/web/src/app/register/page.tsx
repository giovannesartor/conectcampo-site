'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

// ─── Plan config ──────────────────────────────────────────────────────────────

type PlanKey = 'START' | 'PRO' | 'COOPERATIVE' | 'CORPORATE';

const PLANS: Array<{
  key: PlanKey;
  name: string;
  price: string;
  period?: string;
  role: string;
  docType: 'cpf' | 'cnpj';
  description: string;
  free: boolean;
}> = [
  {
    key: 'START',
    name: 'Produtor Rural',
    price: 'R$ 299',
    period: '/mês',
    role: 'PRODUCER',
    docType: 'cpf',
    description: 'Para produtores rurais que buscam crédito com agilidade.',
    free: false,
  },
  {
    key: 'PRO',
    name: 'Empresa',
    price: 'R$ 799',
    period: '/mês',
    role: 'COMPANY',
    docType: 'cnpj',
    description: 'Para empresas do agronegócio que buscam o melhor crédito.',
    free: false,
  },
  {
    key: 'COOPERATIVE',
    name: 'Cooperativa',
    price: 'R$ 2.890',
    period: '/mês',
    role: 'COMPANY',
    docType: 'cnpj',
    description: 'Para cooperativas que desejam oferecer crédito aos seus cooperados.',
    free: false,
  },
  {
    key: 'CORPORATE',
    name: 'Instituição Financeira',
    price: 'Grátis',
    role: 'FINANCIAL_INSTITUTION',
    docType: 'cnpj',
    description: 'Para bancos, FIDCs, securitizadoras e FIAGROs.',
    free: true,
  },
];

// ─── CPF / CNPJ masks ─────────────────────────────────────────────────────────

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromData } = useAuth();

  const initialPlan = (searchParams.get('plan') as PlanKey | null) ?? null;
  const [step, setStep] = useState<'plan' | 'form'>(initialPlan ? 'form' : 'plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(initialPlan);

  const planConfig = PLANS.find((p) => p.key === selectedPlan);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    document: '', // CPF or CNPJ displayed with mask
  });
  const [showPassword, setShowPassword] = useState(false);
  const [lgpd, setLgpd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep URL in sync when plan is selected
  useEffect(() => {
    if (selectedPlan && step === 'form') {
      const url = new URL(window.location.href);
      url.searchParams.set('plan', selectedPlan);
      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedPlan, step]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDocumentChange(raw: string) {
    if (!planConfig) return;
    const masked =
      planConfig.docType === 'cpf' ? maskCPF(raw) : maskCNPJ(raw);
    updateField('document', masked);
  }

  function choosePlan(key: PlanKey) {
    setSelectedPlan(key);
    setStep('form');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planConfig || !selectedPlan) return;
    setError('');
    setLoading(true);

    const cleanDoc = form.document.replace(/\D/g, '');

    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: planConfig.role,
        plan: selectedPlan,
        phone: form.phone.replace(/\D/g, ''),
      };
      if (planConfig.docType === 'cpf') payload.cpf = cleanDoc;
      else payload.cnpj = cleanDoc;

      const { data } = await api.post('/auth/register', payload);

      if (data.requiresPayment && data.invoiceUrl) {
        // Redirecionar para página de pagamento do Asaas
        window.location.href = data.invoiceUrl;
        return;
      }

      // Plano gratuito — salvar tokens e ir ao dashboard
      if (data.accessToken) {
        Cookies.set('accessToken', data.accessToken, {
          expires: 1,
          sameSite: 'strict',
          secure: window.location.protocol === 'https:',
        });
        Cookies.set('refreshToken', data.refreshToken, {
          expires: 7,
          sameSite: 'strict',
          secure: window.location.protocol === 'https:',
        });
        if (setUserFromData) setUserFromData(data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(', ')
          : 'Erro ao criar conta. Verifique os dados e tente novamente.');
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  // ─── Step: Plan selection ────────────────────────────────────────────────────

  if (step === 'plan') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg px-4 py-12">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="mb-8 text-center">
          <Logo size="md" href="/" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Escolha seu plano
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Selecione o plano que melhor se encaixa no seu perfil
          </p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <button
              key={plan.key}
              onClick={() => choosePlan(plan.key)}
              className="group flex flex-col rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 text-left transition-all hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end">
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400 group-hover:underline flex items-center gap-1">
                  Selecionar <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 text-center">
          ConectCampo é um produto{' '}
          <span className="font-semibold">AG Digital</span>
          {' '}· CNPJ 54.079.299/0001-40 · Pagamentos via Asaas
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  // ─── Step: Registration form ─────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Logo size="lg" showText={false} href="/" />
          <div className="mt-8 text-3xl font-bold text-white">
            Conect<span className="text-brand-300">Campo</span>
          </div>

          {planConfig && (
            <div className="mt-8 rounded-2xl bg-white/10 p-6 text-left">
              <p className="text-brand-200 text-xs font-medium uppercase tracking-wide mb-2">
                Plano selecionado
              </p>
              <h3 className="text-white text-xl font-bold">{planConfig.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{planConfig.price}</span>
                {planConfig.period && (
                  <span className="text-brand-200 text-sm">{planConfig.period}</span>
                )}
              </div>
              <p className="mt-3 text-brand-100 text-sm">{planConfig.description}</p>
              {!planConfig.free && (
                <div className="mt-4 flex items-center gap-2 text-xs text-brand-200">
                  <Check className="h-3.5 w-3.5 text-brand-300" />
                  Pagamento via PIX, cartão ou boleto
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setStep('plan')}
            className="mt-6 flex items-center gap-2 text-brand-200 text-sm hover:text-white transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Trocar plano
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Logo size="sm" href="/" />
            <ThemeToggle />
          </div>

          {/* Mobile plan badge */}
          {planConfig && (
            <div className="lg:hidden mb-4 flex items-center justify-between rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 px-4 py-3">
              <div>
                <p className="text-xs text-brand-500 font-medium">Plano selecionado</p>
                <p className="text-sm font-bold text-brand-700 dark:text-brand-400">
                  {planConfig.name} — {planConfig.price}
                  {planConfig.period}
                </p>
              </div>
              <button
                onClick={() => setStep('plan')}
                className="text-xs text-brand-600 hover:underline"
              >
                Trocar
              </button>
            </div>
          )}

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

            {/* Name */}
            <div>
              <label htmlFor="name" className="label">Nome completo</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="input"
                placeholder="Seu nome completo"
                autoComplete="name"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">Telefone</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', maskPhone(e.target.value))}
                className="input"
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                required
              />
            </div>

            {/* CPF or CNPJ */}
            {planConfig && (
              <div>
                <label htmlFor="document" className="label">
                  {planConfig.docType === 'cpf' ? 'CPF' : 'CNPJ'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="document"
                  type="text"
                  value={form.document}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  className="input"
                  placeholder={
                    planConfig.docType === 'cpf'
                      ? '000.000.000-00'
                      : '00.000.000/0000-00'
                  }
                  inputMode="numeric"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Necessário para processamento de pagamento via Asaas (AG Digital)
                </p>
              </div>
            )}

            {/* Password */}
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
                  autoComplete="new-password"
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
              <p className="mt-1 text-xs text-gray-400">
                Use ao menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
              </p>
            </div>

            {/* LGPD */}
            <div className="flex items-start gap-2">
              <input
                id="lgpd"
                type="checkbox"
                checked={lgpd}
                onChange={(e) => setLgpd(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="lgpd" className="text-xs text-gray-500 dark:text-gray-400">
                Li e concordo com os{' '}
                <Link href="/legal/termos-de-uso" className="text-brand-600 hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/legal/privacidade" className="text-brand-600 hover:underline">
                  Política de Privacidade
                </Link>
                . Autorizo o tratamento dos meus dados conforme a LGPD.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !lgpd}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : planConfig?.free ? (
                'Criar conta gratuita'
              ) : (
                <>
                  Assinar agora <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {!planConfig?.free && (
              <p className="text-center text-xs text-gray-400">
                Você será redirecionado para o pagamento seguro via{' '}
                <span className="font-medium">Asaas · AG Digital</span> (PIX, cartão ou boleto)
              </p>
            )}
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

// ─── Page wrapper with Suspense for useSearchParams ───────────────────────────

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
