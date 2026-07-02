'use client';

import { Plus } from 'lucide-react';

export function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
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
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
      {onAdd && (
        <button onClick={onAdd} className="btn-primary text-sm flex items-center gap-2 flex-shrink-0">
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
    <div className="card">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`text-xl font-bold ${
          danger
            ? 'text-red-600 dark:text-red-400'
            : accent
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
