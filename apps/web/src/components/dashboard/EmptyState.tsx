interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card text-center py-16">
      <div className="text-gray-300 dark:text-gray-600 flex justify-center">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-sm mx-auto">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-6">
          {action.label}
        </button>
      )}
    </div>
  );
}
