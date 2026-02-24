'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  CheckCircle2,
  Mail,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Leaf,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/lib/api';

// ─── Plan labels ──────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { name: string; price: string }> = {
  START: { name: 'Produtor Rural', price: 'R$ 299/mês' },
  PRO: { name: 'Empresa', price: 'R$ 799/mês' },
  COOPERATIVE: { name: 'Cooperativa', price: 'R$ 2.890/mês' },
  CORPORATE: { name: 'Instituição Financeira', price: 'Grátis' },
};

// ─── Animated dots ────────────────────────────────────────────────────────────

function AnimatedDots() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCount((c) => (c + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  return <span className="inline-block w-6 text-left">{'·'.repeat(count)}</span>;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Step({
  icon,
  label,
  done,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm transition-all duration-500 ${
          done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : active
            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-300 ring-offset-2 ring-offset-white dark:ring-offset-dark-card'
            : 'bg-gray-100 dark:bg-dark-border text-gray-400'
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <span
        className={`text-sm font-medium transition-colors ${
          done
            ? 'text-emerald-600 dark:text-emerald-400'
            : active
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        {label}
        {active && !done && <AnimatedDots />}
      </span>
    </div>
  );
}

// ─── Main inner component ─────────────────────────────────────────────────────

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId') ?? '';
  const planKey = searchParams.get('plan') ?? '';
  const planInfo = PLAN_LABELS[planKey];

  type Status = 'waiting' | 'confirmed' | 'error';
  const [status, setStatus] = useState<Status>('waiting');
  const [elapsed, setElapsed] = useState(0);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recover invoice URL from sessionStorage (set in the register form)
  useEffect(() => {
    setInvoiceUrl(sessionStorage.getItem('pendingInvoiceUrl'));
    setPlanName(sessionStorage.getItem('pendingPlanName'));
  }, []);

  // Polling
  useEffect(() => {
    if (!userId) return;

    async function checkStatus() {
      try {
        const { data } = await api.get(`/auth/payment-status?userId=${userId}`);
        if (data.isActive || data.paymentStatus === 'ACTIVE') {
          setStatus('confirmed');
          stopPolling();
        }
      } catch {
        // silently ignore transient errors
      }
    }

    function stopPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }

    checkStatus(); // immediate first check
    pollRef.current = setInterval(checkStatus, 4000);
    elapsedRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => stopPolling();
  }, [userId]);

  function reopenPayment() {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // ─── Confirmed screen ────────────────────────────────────────────────────────

  if (status === 'confirmed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg px-4 py-12">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pagamento confirmado!
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Sua assinatura{planInfo ? ` do plano ${planInfo.name}` : ''} foi ativada com sucesso.
          </p>

          <div className="mt-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Assinatura ativa
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {planInfo?.name ?? planName ?? 'Seu plano'} {planInfo ? `· ${planInfo.price}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Verifique seu e-mail
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Enviamos um link de confirmação. Clique nele para liberar seu acesso completo.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Acessar o ConectCampo
            </Link>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Não recebeu o e-mail? Verifique sua caixa de spam ou faça login e solicite o reenvio.
            </p>
          </div>

          <p className="mt-8 text-xs text-gray-300 dark:text-gray-600">
            Pagamento processado por AG Digital · CNPJ 54.079.299/0001-40
          </p>
        </div>
      </div>
    );
  }

  // ─── Waiting screen ──────────────────────────────────────────────────────────

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeLabel =
    elapsed < 60
      ? `${elapsed}s`
      : `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-dark-bg px-4 py-12">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <Logo size="md" href="/" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xl shadow-gray-200/50 dark:shadow-black/20 p-8">

          {/* Spinner area */}
          <div className="flex flex-col items-center gap-4 pb-8 border-b border-gray-100 dark:border-dark-border">
            <div className="relative flex h-20 w-20 items-center justify-center">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-900/40" />
              {/* Spinning arc */}
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-500" />
              {/* Inner icon */}
              <Leaf className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Aguardando pagamento
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Complete o pagamento na aba que abrimos para você
              </p>
            </div>

            {/* Timer pill */}
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-dark-border px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
              <RefreshCw className="h-3 w-3 animate-spin [animation-duration:3s]" />
              Verificando automaticamente · {timeLabel}
            </div>
          </div>

          {/* Steps */}
          <div className="mt-8 space-y-5">
            <Step
              icon={<span className="text-xs font-bold">1</span>}
              label="Cadastro criado"
              done
              active={false}
            />
            <Step
              icon={<span className="text-xs font-bold">2</span>}
              label="Aguardando confirmação do pagamento"
              done={false}
              active
            />
            <Step
              icon={<span className="text-xs font-bold">3</span>}
              label="Verificação de e-mail"
              done={false}
              active={false}
            />
            <Step
              icon={<span className="text-xs font-bold">4</span>}
              label="Acesso liberado"
              done={false}
              active={false}
            />
          </div>

          {/* Plan info */}
          {planInfo && (
            <div className="mt-8 flex items-center justify-between rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 px-4 py-3">
              <div>
                <p className="text-xs text-brand-500 font-medium">Plano</p>
                <p className="text-sm font-bold text-brand-700 dark:text-brand-300">
                  {planInfo.name}
                </p>
              </div>
              <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                {planInfo.price}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 space-y-3">
            {invoiceUrl && (
              <button
                onClick={reopenPayment}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir pagamento novamente
              </button>
            )}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Não feche esta aba — confirmamos automaticamente assim que o pagamento for processado.
            </p>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
          <AlertCircle className="h-3.5 w-3.5" />
          PIX e cartão são confirmados em segundos. Boleto pode levar até 3 dias úteis.
        </div>

        <p className="mt-3 text-center text-xs text-gray-300 dark:text-gray-700">
          Pagamento processado por AG Digital · CNPJ 54.079.299/0001-40
        </p>
      </div>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
