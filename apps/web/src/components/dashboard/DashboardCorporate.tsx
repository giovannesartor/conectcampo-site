'use client';

/**
 * Dashboard — Instituição Financeira (Plano CORPORATE)
 * Role: FINANCIAL_INSTITUTION
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/format';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import {
  FileText,
  BarChart3,
  ArrowRight,
  Landmark,
  TrendingUp,
  Activity,
  Send,
  CheckCircle2,
  Filter,
  Search,
  ChevronDown,
} from 'lucide-react';

type FilterKey = 'all' | 'OPEN' | 'IN_ANALYSIS' | 'APPROVED';

interface Operation {
  id: string;
  type: string;
  status: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  createdAt: string;
  culture?: string;
  region?: string;
  riskScore?: number;
  producer?: { name?: string; businessName?: string };
  _count?: { proposals: number };
}

const FILTER_CHIPS = [
  { key: 'all' as FilterKey,         label: 'Todos' },
  { key: 'OPEN' as FilterKey,        label: 'Em Aberto' },
  { key: 'IN_ANALYSIS' as FilterKey, label: 'Em Análise' },
  { key: 'APPROVED' as FilterKey,    label: 'Aprovado' },
];

export function DashboardCorporate() {
  const router = useRouter();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    proposalsSent: 0,
    conversionRate: 0,
    activePortfolio: 0,
    totalPortfolioVolume: 0,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const opsRes = await api.get('/operations?page=1&perPage=50');
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      if (!Array.isArray(ops)) { setLoading(false); return; }
      setOperations(ops);
      const active = ops.filter((o) => o.status === 'ACTIVE' || o.status === 'APPROVED').length;
      const approved = ops.filter((o) => o.status === 'APPROVED' || o.status === 'COMPLETED').length;
      const proposals = ops.reduce((a, o) => a + (o._count?.proposals ?? 0), 0);
      const volume = ops.filter((o) => o.status === 'ACTIVE').reduce((a, o) => a + (o.requestedAmount ?? 0), 0);
      setStats({
        totalOpportunities: ops.filter((o) => ['OPEN', 'IN_ANALYSIS', 'APPROVED'].includes(o.status)).length,
        proposalsSent: proposals,
        conversionRate: ops.length > 0 ? Math.round((approved / ops.length) * 100) : 0,
        activePortfolio: active,
        totalPortfolioVolume: volume,
      });
    } catch { /* new user */ } finally { setLoading(false); }
  }

  const visible = operations.filter((op) => {
    const matchStatus = filter === 'all' || op.status === filter;
    const matchSearch = !search || [op.purpose, op.type, op.culture, op.region, op.producer?.businessName, op.producer?.name]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Landmark className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Deal-flow de Crédito Agro</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                CORPORATE
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Carregando...' : `${stats.totalOpportunities} oportunidades disponíveis agora`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/matching" className="btn-secondary text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Portfólio
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Oportunidades"
          value={stats.totalOpportunities}
          subtitle="disponíveis para análise"
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Propostas Enviadas"
          value={stats.proposalsSent}
          subtitle="aguardando resposta"
          icon={<Send className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${stats.conversionRate}%`}
          subtitle="aprovações / propostas"
          icon={<CheckCircle2 className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Portfólio Ativo"
          value={formatCurrency(stats.totalPortfolioVolume)}
          subtitle={`${stats.activePortfolio} operações`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Filter bar */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {FILTER_CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === c.key
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cultura, região..."
              className="input pl-9 py-1.5 text-sm w-full sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Operations feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Operações Disponíveis
            {visible.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">({visible.length})</span>
            )}
          </h3>
          <Link href="/dashboard/matching" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
            Matching IA <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Landmark className="h-14 w-14" />}
            title="Nenhuma oportunidade encontrada"
            description="Ajuste os filtros ou aguarde novas operações dos produtores cadastrados na plataforma."
          />
        ) : (
          <div className="space-y-2">
            {visible.map((op) => (
              <div
                key={op.id}
                className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all"
                onClick={() => router.push(`/dashboard/operations/${op.id}`)}
              >
                {/* Icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                  <FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>

                {/* Main */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {op.purpose ?? op.type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {op.culture && <span>🌱 {op.culture}</span>}
                        {op.region && <span>📍 {op.region}</span>}
                        <span>📅 {formatRelative(op.createdAt)}</span>
                        {(op._count?.proposals ?? 0) > 0 && (
                          <span className="text-brand-600 font-medium">{op._count?.proposals} proposta(s)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(op.requestedAmount)}</p>
                      <StatusBadge status={op.status} />
                    </div>
                  </div>
                  {/* Risk tag */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{op.termMonths}m</span>
                    {op.riskScore !== undefined && (
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        op.riskScore >= 700 ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                        : op.riskScore >= 500 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        Score {op.riskScore}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/operations/${op.id}`); }}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Enviar Proposta
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {visible.length >= 10 && (
              <div className="pt-2 text-center">
                <button className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1 mx-auto">
                  Carregar mais <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
