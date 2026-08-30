'use client';

import { Plus } from 'lucide-react';

export function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[var(--shadow-soft)] dark:border-gray-800 dark:bg-gray-900">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600 dark:border-brand-900 dark:border-t-brand-400" />
        <span className="sr-only">Carregando</span>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  onAdd,
  addLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[var(--shadow-soft)] dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-brand-700" />
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">{icon}</span>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-[-0.02em] text-gray-950 dark:text-white sm:text-2xl">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
      {onAdd && (
        <button onClick={onAdd} className="btn-primary w-full flex-shrink-0 text-sm sm:w-auto">
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  danger,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  danger?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="card relative min-h-[126px] overflow-hidden">
      <span className={`absolute inset-x-0 top-0 h-[3px] ${danger ? 'bg-red-500' : accent ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight ${
          danger
            ? 'text-red-600 dark:text-red-400'
            : accent
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs leading-5 text-gray-400">{sub}</p>}
    </div>
  );
}
