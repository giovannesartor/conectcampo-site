'use client';

import { ReactNode } from 'react';
import { Sprout } from 'lucide-react';

export function DashboardWelcome({ name, children }: { name?: string; children: ReactNode }) {
  const firstName = name?.trim().split(/\s+/)[0];
  const isDemo = !firstName || /demo|demonstra|review|teste/i.test(name ?? '');
  return (
    <section className="dashboard-heading relative overflow-hidden !border-brand-200/70 !bg-brand-50/60 dark:!border-brand-900 dark:!bg-brand-950/20">
      <div className="min-w-0">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
          <Sprout className="h-4 w-4" aria-hidden="true" /> ConectCampo · Gestão rural
        </p>
        <h1 className="break-words text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
          {isDemo ? 'Seu campo, em dia.' : `Olá, ${firstName}.`}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-400">
          Suas operações, seu planejamento e as informações do campo. Tudo no mesmo lugar.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}
