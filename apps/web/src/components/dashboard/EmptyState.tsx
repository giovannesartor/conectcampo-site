import { type ComponentType, isValidElement, createElement } from 'react';

interface EmptyStateProps {
  icon: React.ReactNode | ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
  // Lucide icons are forwardRef objects (typeof === 'object'), not plain functions.
  // Use isValidElement to detect already-rendered nodes; otherwise use createElement.
  const renderedIcon = isValidElement(Icon)
    ? Icon
    : (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null))
      ? createElement(Icon as ComponentType<{ className?: string }>, { className: 'h-12 w-12' })
      : Icon;

  const btn = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null);

  return (
    <div className="card py-14 text-center sm:py-16">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-500 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-400">{renderedIcon}</div>
      <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>
      {btn && (
        <button onClick={btn.onClick} className="btn-primary mt-6">
          {btn.label}
        </button>
      )}
    </div>
  );
}
