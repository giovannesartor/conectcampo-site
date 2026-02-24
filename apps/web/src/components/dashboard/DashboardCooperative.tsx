'use client';

/**
 * Dashboard — Cooperativa (Plano COOPERATIVE)
 * Role: COMPANY, Plan: COOPERATIVE
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/format';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import {
  Plus,
  FileText,
  BarChart3,
  ArrowRight,
  Users,
  UsersRound,
  TrendingUp,
  CreditCard,
  Download,
  Activity,
} from 'lucide-react';

type TabKey = 'overview' | 'cooperados' | 'relatorios';

interface Operation {
  id: string;
  type: string;
  status: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  createdAt: string;
  _count?: { proposals: number };
  producer?: { name?: string; businessName?: string };
}

// Mock cooperados until the multi-CNPJ feature is implemented in the API
const MOCK_COOPERADOS = [
  { id: '1', name: 'Fazenda Esperança', cnpj: '12.345.678/0001-99', score: 720, status: 'ACTIVE', ops: 3 },
  { id: '2', name: 'Agropecuária Silva Ltda', cnpj: '98.765.432/0001-11', score: 680, status: 'ACTIVE', ops: 1 },
  { id: '3', name: 'Sítio Três Rios', cnpj: '45.678.901/0001-23', score: 590, status: 'PENDING', ops: 0 },
  { id: '4', name: 'Granja Primavera', cnpj: '32.109.876/0001-55', score: 760, status: 'ACTIVE', ops: 2 },
];

export function DashboardCooperative() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('overview');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOps: 0,
    activeOps: 0,
    proposals: 0,
    totalVolume: 0,
    cooperados: MOCK_COOPERADOS.length,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const opsRes = await api.get('/operations?page=1&perPage=10');
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      if (!Array.isArray(ops)) { setLoading(false); return; }
      setOperations(ops.slice(0, 5));
      const active = ops.filter((o) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'].includes(o.status)).length;
      const proposals = ops.reduce((a, o) => a + (o._count?.proposals ?? 0), 0);
      const volume = ops.reduce((a, o) => a + (o.requestedAmount ?? 0), 0);
      setStats({ totalOps: ops.length, activeOps: active, proposals, totalVolume: volume, cooperados: MOCK_COOPERADOS.length });
    } catch { /* new user */ } finally { setLoading(false); }
  }

  const TAB_LABELS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'cooperados', label: 'Cooperados' },
    { key: 'relatorios', label: 'Relatórios' },
  ];

  const scoreColor = (s: number) => s >= 700 ? 'text-green-600' : s >= 500 ? 'text-blue-600' : 'text-amber-600';
  const scoreBg = (s: number) => s >= 700 ? 'bg-green-50 dark:bg-green-950/20' : s >= 500 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-amber-50 dark:bg-amber-950/20';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40">
            <UsersRound className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gestão Coletiva de Crédito</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-950/40 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                COOPERATIVA
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie cooperados, operações consolidadas e relatórios</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar
          </button>
          <Link href="/dashboard/operations" className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Operação
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        {TAB_LABELS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cooperados Cadastrados"
          value={stats.cooperados}
          subtitle="entidades ativas"
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Operações do Grupo"
          value={stats.totalOps}
          subtitle={`${stats.activeOps} em andamento`}
          icon={<Activity className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Volume Total"
          value={formatCurrency(stats.totalVolume)}
          subtitle="gerenciado pela cooperativa"
          icon={<TrendingUp className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Propostas Recebidas"
          value={stats.proposals}
          subtitle="para o grupo"
          icon={<CreditCard className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Operações Consolidadas</h3>
              <Link href="/dashboard/operations" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}</div>
            ) : operations.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-14 w-14" />}
                title="Nenhuma operação consolidada"
                description="Cadastre cooperados e crie operações em nome do grupo."
                action={{ label: 'Nova Operação', onClick: () => router.push('/dashboard/operations') }}
              />
            ) : (
              <div className="space-y-2">
                {operations.map((op) => (
                  <div
                    key={op.id}
                    onClick={() => router.push(`/dashboard/operations/${op.id}`)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{op.purpose ?? op.type}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(op.requestedAmount)} · {op.termMonths}m · {formatRelative(op.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={op.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
            <div className="space-y-1.5">
              {[
                { href: '/dashboard/operations', icon: <Plus className="h-4 w-4 text-violet-600" />, label: 'Nova Operação', bg: 'bg-violet-50 dark:bg-violet-950/30' },
                { href: '/dashboard/documents',  icon: <FileText className="h-4 w-4 text-blue-600" />, label: 'Documentos', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { href: '/dashboard/scoring',    icon: <BarChart3 className="h-4 w-4 text-green-600" />, label: 'Scores do Grupo', bg: 'bg-green-50 dark:bg-green-950/30' },
              ].map((a) => (
                <Link
                  key={a.href + a.label}
                  href={a.href}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className={`h-8 w-8 rounded-lg ${a.bg} flex items-center justify-center`}>{a.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'cooperados' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cooperados Cadastrados</h3>
            <button className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="pb-3 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Empresa</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">CNPJ</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Score</th>
                  <th className="pb-3 pr-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Operações</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                {MOCK_COOPERADOS.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-violet-700 dark:text-violet-400">{c.name[0]}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{c.cnpj}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${scoreBg(c.score)} ${scoreColor(c.score)}`}>
                        {c.score}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{c.ops}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        {c.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'relatorios' && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="h-14 w-14 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Relatórios em breve</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">Relatórios consolidados do grupo, exportação em PDF e Excel estarão disponíveis em breve.</p>
          <button className="mt-4 btn-secondary text-sm flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar dados disponíveis
          </button>
        </div>
      )}
    </div>
  );
}
