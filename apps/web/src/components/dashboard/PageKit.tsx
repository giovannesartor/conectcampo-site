'use client';

import { Plus } from 'lucide-react';

export function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600 dark:border-brand-900 dark:border-t-brand-400" />
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
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/90 bg-gradient-to-br from-white via-white to-emerald-50/60 p-5 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{icon}</span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-gray-950 dark:text-white">{title}</h1>
            <p className="mt-0.5 text-sm leading-5 text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
      </div>
      {onAdd && (
        <button onClick={onAdd} className="btn-primary flex-shrink-0 text-sm">
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
    <div className="card relative overflow-hidden">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${danger ? 'bg-red-500' : accent ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
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
