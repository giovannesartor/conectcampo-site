'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'SUBMITTED', label: 'Enviado' },
  { value: 'UNDER_ANALYSIS', label: 'Em Análise' },
  { value: 'SCORING_COMPLETE', label: 'Score Completo' },
  { value: 'MATCHING', label: 'Matching' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'PROPOSAL_RECEIVED', label: 'Proposta Recebida' },
  { value: 'PROPOSAL_ACCEPTED', label: 'Proposta Aceita' },
  { value: 'CONTRACT_SIGNED', label: 'Contrato Assinado' },
  { value: 'FUNDED', label: 'Financiado' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const TYPE_LABELS: Record<string, string> = {
  CPR_FINANCIAL: 'CPR Financeira',
  CPR_PHYSICAL: 'CPR Física',
  CDCA: 'CDCA',
  CRA: 'CRA',
  LCA: 'LCA',
  FIAGRO: 'FIAGRO',
};

export default function OperationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const perPage = 10;

  useEffect(() => {
    loadOperations();
  }, [page, statusFilter]);

  async function loadOperations() {
    setLoading(true);
    try {
      const params: any = { page, perPage };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/operations', { params });
      setOperations(data.data || data || []);
      setTotal(data.total || 0);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Operações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} operações registradas</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/operations/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Operação</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input px-3 py-2 text-sm w-48"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : operations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma operação encontrada"
          description="Crie sua primeira operação para começar a buscar crédito rural."
          actionLabel="Nova Operação"
          onAction={() => router.push('/dashboard/operations/new')}
        />
      ) : (
        <>
          <div className="space-y-3">
            {operations.map((op) => (
              <div
                key={op.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/operations/${op.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {TYPE_LABELS[op.type] || op.type}
                        </h4>
                        <StatusBadge status={op.status} />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatCurrency(op.amount)} · {op.termMonths} meses · {formatDate(op.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    {op.riskScore && (
                      <p className="text-sm font-medium text-brand-600">Score: {op.riskScore.totalScore}</p>
                    )}
                    <p className="text-xs text-gray-400">{op._count?.proposals || 0} propostas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
