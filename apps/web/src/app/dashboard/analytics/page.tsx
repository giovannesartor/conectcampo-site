'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, BarChart3, CircleDollarSign, Gauge, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { ErrorState, PageHeader, Spinner, StatCard } from '@/components/dashboard/PageKit';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

interface Operation {
  id: string;
  status: string;
  purpose?: string;
  type: string;
  amount?: number;
  requestedAmount?: number;
  createdAt: string;
}

const TERMINAL = ['COMPLETED', 'CANCELLED', 'REJECTED'];
const APPROVED = ['APPROVED', 'CONTRACTED', 'COMPLETED'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const endpoint = user.role === 'FINANCIAL_INSTITUTION' || user.role === 'CREDIT_ANALYST'
        ? '/operations/available?page=1&perPage=100'
        : '/operations?page=1&perPage=100';
      const { data } = await api.get(endpoint);
      const list = data?.data ?? data?.operations ?? data ?? [];
      setOperations(Array.isArray(list) ? list : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const value = (operation: Operation) => Number(operation.amount ?? operation.requestedAmount ?? 0);
    const totalVolume = operations.reduce((sum, operation) => sum + value(operation), 0);
    const active = operations.filter((operation) => !TERMINAL.includes(operation.status)).length;
    const approved = operations.filter((operation) => APPROVED.includes(operation.status)).length;
    const status = operations.reduce<Record<string, number>>((acc, operation) => {
      acc[operation.status] = (acc[operation.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      totalVolume,
      active,
      approved,
      average: operations.length ? totalVolume / operations.length : 0,
      conversion: operations.length ? Math.round((approved / operations.length) * 100) : 0,
      status: Object.entries(status).sort((a, b) => b[1] - a[1]),
    };
  }, [operations]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics da operação"
        subtitle="Volume, conversão e distribuição da carteira em uma visão única e rastreável."
        icon={<BarChart3 className="h-5 w-5" />}
      />
      {error ? <ErrorState onRetry={load} /> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Volume analisado" value={formatCurrency(metrics.totalVolume)} accent />
            <StatCard label="Operações ativas" value={metrics.active} sub={`${operations.length} no total`} />
            <StatCard label="Ticket médio" value={metrics.average ? formatCurrency(metrics.average) : '—'} />
            <StatCard label="Conversão" value={`${metrics.conversion}%`} sub={`${metrics.approved} aprovadas ou concluídas`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="card">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-brand-600" />
                <h2 className="font-bold text-gray-950 dark:text-white">Distribuição por status</h2>
              </div>
              <div className="mt-5 space-y-4">
                {metrics.status.length === 0 ? <p className="text-sm text-gray-500">Nenhuma operação para analisar.</p> : metrics.status.map(([status, count]) => (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <StatusBadge status={status} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max((count / Math.max(operations.length, 1)) * 100, 4)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-brand-600" />
                  <h2 className="font-bold text-gray-950 dark:text-white">Operações recentes</h2>
                </div>
                <Link href="/dashboard/operations" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Ver todas <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
                {operations.slice(0, 6).map((operation) => (
                  <Link key={operation.id} href={`/dashboard/operations/${operation.id}`} className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-brand-700">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{operation.purpose || operation.type}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{formatCurrency(Number(operation.amount ?? operation.requestedAmount ?? 0))}</p>
                    </div>
                    <StatusBadge status={operation.status} />
                  </Link>
                ))}
                {operations.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Os indicadores aparecerão após a primeira operação.</p>}
              </div>
            </section>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/dashboard/matching" className="card card-hover flex items-center gap-3"><TrendingUp className="h-5 w-5 text-brand-600" /><span className="font-semibold">Explorar oportunidades</span></Link>
            <Link href="/dashboard/scoring" className="card card-hover flex items-center gap-3"><Gauge className="h-5 w-5 text-brand-600" /><span className="font-semibold">Analisar score e risco</span></Link>
            <Link href="/dashboard/valuation" className="card card-hover flex items-center gap-3"><CircleDollarSign className="h-5 w-5 text-brand-600" /><span className="font-semibold">Abrir valuations</span></Link>
          </div>
        </>
      )}
    </div>
  );
}
