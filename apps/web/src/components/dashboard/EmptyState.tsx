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
    <div className="card text-center py-16">
      <div className="text-gray-300 dark:text-gray-600 flex justify-center">{renderedIcon}</div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-sm mx-auto">{description}</p>
      {btn && (
        <button onClick={btn.onClick} className="btn-primary mt-6">
          {btn.label}
        </button>
      )}
    </div>
  );
}
