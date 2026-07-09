'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search, Filter, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'SUBMITTED', label: 'Enviado' },
  { value: 'SCORING', label: 'Scoring' },
  { value: 'MATCHING', label: 'Matching' },
  { value: 'PROPOSALS_RECEIVED', label: 'Propostas Recebidas' },
  { value: 'ACCEPTED', label: 'Aceita' },
  { value: 'IN_ANALYSIS', label: 'Em Análise' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'REJECTED', label: 'Rejeitada' },
  { value: 'CONTRACTED', label: 'Contratada' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const TYPE_LABELS: Record<string, string> = {
  CUSTEIO: 'Custeio',
  INVESTIMENTO: 'Investimento',
  GIRO: 'Capital de Giro',
  MERCADO_CAPITAIS: 'Mercado de Capitais',
};

export default function OperationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const perPage = 10;
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOperations([]);
    setPage(1);
    setAllLoaded(false);
    setLoading(true);
    loadOperations(1, true);
  }, [statusFilter]);

  useEffect(() => {
    if (page > 1 && !allLoaded) {
      loadOperations(page, false);
    }
  }, [page]);

  useEffect(() => {
    if (!loaderRef.current || allLoaded) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loadingMore && !allLoaded) setPage((p) => p + 1); },
      { threshold: 0.1 },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [allLoaded, loadingMore]);

  async function loadOperations(pageNum = 1, reset = false) {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const params: any = { page: pageNum, perPage };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/operations', { params });
      const items = data.data || data || [];
      setOperations((prev) => reset ? items : [...prev, ...items]);
      setTotal(data.meta?.total || data.total || 0);
      if (items.length < perPage) setAllLoaded(true);
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const hasMore = !allLoaded && operations.length < total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Operações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} operações registradas</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/operations/new')}
          onMouseEnter={() => router.prefetch('/dashboard/operations/new')}
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

          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center py-6">
              {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-brand-600" />}
              {!loadingMore && <p className="text-sm text-gray-400">Role para carregar mais</p>}
            </div>
          )}
          {!hasMore && operations.length > 0 && (
            <p className="text-center text-sm text-gray-400 py-4">Todas as {total} operações carregadas</p>
          )}
        </>
      )}
    </div>
  );
}
