'use client';

/**
 * Dashboard — Instituição Financeira / Parceira
 * Role: FINANCIAL_INSTITUTION
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/format';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowRight,
  Building2,
  CreditCard,
  Activity,
  RefreshCw,
} from 'lucide-react';

interface Operation {
  id: string;
  type: string;
  status: string;
  amount: number;
  termMonths: number;
  purpose: string;
  createdAt: string;
  producerName?: string;
  score?: number;
}

type FilterKey = 'all' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all',          label: 'Todas' },
  { key: 'SUBMITTED',   label: 'Submetida' },
  { key: 'UNDER_REVIEW', label: 'Em Análise' },
  { key: 'APPROVED',    label: 'Aprovado' },
];

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${part}, ${name.split(' ')[0]}!` : `${part}!`;
}

export function DashboardCorporate() {
  const { user } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOps: 0,
    pendingOps: 0,
    approvedOps: 0,
    rejectedOps: 0,
    conversionRate: 0,
    totalVolume: 0,
    pendingVolume: 0,
    avgScore: 0,
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const opsRes = await api.get('/operations?page=1&perPage=50');
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      if (!Array.isArray(ops)) { setLoading(false); setRefreshing(false); return; }
      setOperations(ops);

      const pending = ops.filter((o) => ['SUBMITTED', 'UNDER_REVIEW'].includes(o.status)).length;
      const approved = ops.filter((o) => ['APPROVED', 'COMPLETED'].includes(o.status)).length;
      const rejected = ops.filter((o) => o.status === 'REJECTED').length;
      const volume = ops.reduce((a, o) => a + (o.amount ?? 0), 0);
      const pendingVol = ops.filter((o) => ['SUBMITTED', 'UNDER_REVIEW'].includes(o.status)).reduce((a, o) => a + (o.amount ?? 0), 0);
      const scored = ops.filter((o) => (o.score ?? 0) > 0);
      const avgScore = scored.length > 0 ? scored.reduce((a, o) => a + (o.score ?? 0), 0) / scored.length : 0;

      setStats({
        totalOps: ops.length,
        pendingOps: pending,
        approvedOps: approved,
        rejectedOps: rejected,
        conversionRate: ops.length > 0 ? Math.round((approved / ops.length) * 100) : 0,
        totalVolume: volume,
        pendingVolume: pendingVol,
        avgScore: Math.round(avgScore),
      });
    } catch { /* empty portfolio */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all'
    ? operations
    : operations.filter((op) => op.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/40">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{greeting(user?.name)}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Building2 className="h-3 w-3" /> Parceiro
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestão de crédito e análise de operações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing} className="btn-ghost flex items-center gap-1.5 text-sm" title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/dashboard/matching" className="btn-primary text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Operações Disponíveis
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Aguardando Análise" value={stats.pendingOps} subtitle="submetidas ou em revisão" icon={<Clock className="h-6 w-6" />} color="amber" />
        <KPICard title="Operações Aprovadas" value={stats.approvedOps} subtitle={`taxa de conversão: ${stats.conversionRate}%`} icon={<CheckCircle2 className="h-6 w-6" />} color="green" />
        <KPICard title="Volume em Análise" value={formatCurrency(stats.pendingVolume)} subtitle="pipeline ativo" icon={<CreditCard className="h-6 w-6" />} color="blue" />
        <KPICard title="Volume Total" value={formatCurrency(stats.totalVolume)} subtitle={`${stats.totalOps} operações`} icon={<TrendingUp className="h-6 w-6" />} color="purple" />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === c.key
                ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-brand-300'
            }`}
          >
            {c.label}
            {c.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({operations.filter((o) => c.key === 'APPROVED' ? ['APPROVED','COMPLETED'].includes(o.status) : o.status === c.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {filter === 'all' ? 'Todas as Operações' : FILTER_CHIPS.find((c) => c.key === filter)?.label}
              <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
            </h3>
            <Link href="/dashboard/matching" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
              Ver disponíveis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Nenhuma operação{filter !== 'all' ? ' com este filtro' : ''}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {filter === 'all' ? 'Acesse as operações disponíveis para começar a analisar.' : 'Tente outro filtro acima.'}
              </p>
              {filter === 'all' && (
                <Link href="/dashboard/matching" className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-500 font-medium">
                  Ver operações disponíveis <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                    <th className="pb-3 font-medium">Operação</th>
                    <th className="pb-3 font-medium">Produtor</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                  {filtered.map((op) => (
                    <tr key={op.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900 dark:text-white">{op.purpose ?? op.type}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{op.termMonths}m</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{op.producerName ?? '—'}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{formatCurrency(op.amount)}</td>
                      <td className="py-3 pr-4">
                        {op.score != null ? (
                          <span className={`text-xs font-semibold ${op.score >= 80 ? 'text-green-600' : op.score >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                            {op.score}
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={op.status} /></td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{formatRelative(op.createdAt)}</td>
                      <td className="py-3">
                        <Link href={`/dashboard/operations/${op.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-600 hover:text-brand-500 flex items-center gap-1">
                          Ver <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Resumo Financeiro</h3>
            <div className="space-y-3">
              {[
                { label: 'Taxa de Conversão', value: `${stats.conversionRate}%`, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, sub: 'aprovadas / total' },
                { label: 'Score Médio Carteira', value: stats.avgScore > 0 ? String(stats.avgScore) : '—', icon: <BarChart3 className="h-4 w-4 text-blue-500" />, sub: 'das operações avaliadas' },
                { label: 'Operações Recusadas', value: stats.rejectedOps, icon: <Activity className="h-4 w-4 text-red-400" />, sub: 'no período' },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div>{m.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{m.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Instituição Financeira</p>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Acesse as operações disponíveis e envie propostas de crédito.</p>
            <Link href="/dashboard/matching" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline">
              Ver Deal Flow <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
