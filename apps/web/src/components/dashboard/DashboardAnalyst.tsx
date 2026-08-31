'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, BarChart3, ClipboardList, Clock3, FileSearch } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/format';
import { ErrorState, PageHeader, Spinner, StatCard } from './PageKit';
import { StatusBadge } from './StatusBadge';

interface AnalystOperation {
  id: string;
  status: string;
  purpose?: string;
  type: string;
  amount?: number;
  requestedAmount?: number;
  producerName?: string;
  score?: number | null;
  createdAt: string;
}

function ageHours(createdAt: string) {
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 3_600_000);
}

export function DashboardAnalyst() {
  const [operations, setOperations] = useState<AnalystOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/operations/available?page=1&perPage=100');
      const list = data?.data ?? data ?? [];
      setOperations(Array.isArray(list) ? list : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const queue = useMemo(() => [...operations].sort((a, b) => {
    const priorityA = ageHours(a.createdAt) >= 48 ? 2 : ageHours(a.createdAt) >= 24 ? 1 : 0;
    const priorityB = ageHours(b.createdAt) >= 48 ? 2 : ageHours(b.createdAt) >= 24 ? 1 : 0;
    return priorityB - priorityA || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }), [operations]);
  const critical = operations.filter((operation) => ageHours(operation.createdAt) >= 48).length;
  const attention = operations.filter((operation) => ageHours(operation.createdAt) >= 24 && ageHours(operation.createdAt) < 48).length;
  const withoutScore = operations.filter((operation) => operation.score == null).length;
  const volume = operations.reduce((sum, operation) => sum + Number(operation.amount ?? operation.requestedAmount ?? 0), 0);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de análise"
        subtitle="Fila priorizada por tempo de espera, pendências e próxima ação do crédito."
        icon={<FileSearch className="h-5 w-5" />}
      />
      {error ? <ErrorState onRetry={load} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Fila aberta" value={operations.length} sub="operações disponíveis" />
            <StatCard label="SLA crítico" value={critical} sub="há mais de 48 horas" danger={critical > 0} />
            <StatCard label="Atenção" value={attention} sub="entre 24 e 48 horas" />
            <StatCard label="Volume da fila" value={formatCurrency(volume)} accent />
          </div>

          <section className="card overflow-hidden p-0">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-950 dark:text-white">Prioridades de hoje</h2>
                <p className="mt-1 text-sm text-gray-500">{withoutScore} operações ainda sem score disponível.</p>
              </div>
              <Link href="/dashboard/matching" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">Abrir fila completa <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {queue.length === 0 ? (
              <div className="px-6 py-14 text-center"><ClipboardList className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-semibold text-gray-900 dark:text-white">Fila em dia</p><p className="mt-1 text-sm text-gray-500">Novas operações submetidas aparecerão aqui.</p></div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {queue.slice(0, 8).map((operation) => {
                  const hours = ageHours(operation.createdAt);
                  const priority = hours >= 48 ? 'Crítica' : hours >= 24 ? 'Atenção' : 'Normal';
                  return (
                    <Link key={operation.id} href={`/dashboard/operations/${operation.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 sm:flex-row sm:items-center">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${hours >= 48 ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : hours >= 24 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' : 'bg-brand-50 text-brand-700 dark:bg-brand-950/30'}`}>
                        {hours >= 48 ? <AlertTriangle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-950 dark:text-white">{operation.purpose || operation.type}</span>
                        <span className="mt-1 block text-xs text-gray-500">{operation.producerName || 'Produtor'} · {formatCurrency(Number(operation.amount ?? operation.requestedAmount ?? 0))} · {formatRelative(operation.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${hours >= 48 ? 'text-red-600' : hours >= 24 ? 'text-amber-600' : 'text-gray-500'}`}>{priority}</span>
                        <StatusBadge status={operation.status} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/dashboard/scoring" className="card card-hover flex items-center gap-3"><BarChart3 className="h-5 w-5 text-brand-600" /><span className="font-semibold">Score & risco</span></Link>
            <Link href="/dashboard/smart-docs" className="card card-hover flex items-center gap-3"><FileSearch className="h-5 w-5 text-brand-600" /><span className="font-semibold">Conferir documentos</span></Link>
            <Link href="/dashboard/cpr" className="card card-hover flex items-center gap-3"><ClipboardList className="h-5 w-5 text-brand-600" /><span className="font-semibold">CPR & garantias</span></Link>
          </div>
        </>
      )}
    </div>
  );
}
