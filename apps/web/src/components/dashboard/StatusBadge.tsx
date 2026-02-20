interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  SUBMITTED: { label: 'Enviada', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  SCORING: { label: 'Em Scoring', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  MATCHING: { label: 'Em Matching', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  PROPOSALS_RECEIVED: { label: 'Propostas Recebidas', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  ACCEPTED: { label: 'Aceita', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  IN_ANALYSIS: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  APPROVED: { label: 'Aprovada', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { label: 'Rejeitada', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CONTRACTED: { label: 'Contratada', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  COMPLETED: { label: 'Concluída', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  // Roles
  PRODUCER: { label: 'Produtor', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  COMPANY: { label: 'Empresa', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  FINANCIAL_INSTITUTION: { label: 'Instituição Financeira', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  CREDIT_ANALYST: { label: 'Analista', className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  ADMIN: { label: 'Admin', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  // Operation Types
  CUSTEIO: { label: 'Custeio', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  INVESTIMENTO: { label: 'Investimento', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  GIRO: { label: 'Capital de Giro', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  MERCADO_CAPITAIS: { label: 'Mercado de Capitais', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
