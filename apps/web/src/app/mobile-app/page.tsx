'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BellRing,
  FileCheck2,
  Landmark,
  Leaf,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth-context';

const capabilities = [
  { icon: Landmark, label: 'Crédito e propostas' },
  { icon: FileCheck2, label: 'CPR e documentos' },
  { icon: Leaf, label: 'Produção e campo' },
  { icon: BellRing, label: 'Alertas importantes' },
];

export default function MobileAppPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [isLoading, router, user]);

  if (isLoading || user) {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-brand-950 px-6 text-white">
        <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
          <Logo size="lg" variant="icon" href="" className="rounded-3xl shadow-2xl shadow-black/20" />
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15">
            <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand-300" />
          </span>
          <p className="text-sm text-brand-100">Preparando seu ConectCampo…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#f7faf8] text-gray-950 dark:bg-dark-bg dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,160,60,0.20),transparent_46%),linear-gradient(145deg,#001410,#003c28_58%,#006830)]" />

      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-lg flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between">
          <Logo size="sm" href="" className="rounded-2xl bg-white/95 px-3 py-2 shadow-lg shadow-black/10" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Ambiente seguro
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-12 text-white">
          <span className="mb-5 w-fit rounded-full border border-brand-300/30 bg-brand-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-200">
            O agro conectado
          </span>
          <h1 className="max-w-md text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">
            Sua operação inteira, na palma da mão.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-brand-100/90">
            Crédito, CPR, documentos, produção e mercado em uma plataforma feita para decisões mais rápidas e seguras.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-2.5">
            {capabilities.map(({ icon: Icon, label }) => (
              <div key={label} className="flex min-h-16 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3 backdrop-blur-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-tight text-white/95">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-gray-200/80 bg-white p-4 shadow-2xl shadow-brand-950/15 dark:border-dark-border dark:bg-dark-card">
          <Link href="/login" className="btn-primary flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl text-base">
            Entrar na minha conta <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/register" className="mt-2.5 flex min-h-13 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 dark:border-dark-border dark:bg-dark-bg dark:text-brand-300 dark:hover:bg-brand-950/30">
            Criar minha conta
          </Link>
          <p className="mt-3 text-center text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </div>
      </section>
    </main>
  );
}
