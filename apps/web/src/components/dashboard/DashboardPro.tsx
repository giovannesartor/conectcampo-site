'use client';

/**
 * Dashboard — Empresa (Plano PRO)
 * Role: COMPANY, Plan: PRO
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
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  CreditCard,
} from 'lucide-react';

interface Operation {
  id: string;
  type: string;
  status: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  createdAt: string;
  _count?: { proposals: number };
}

export function DashboardPro() {
  const { user } = useAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOps: 0,
    activeOps: 0,
    proposals: 0,
    approvedOps: 0,
    totalVolume: 0,
    avgTicket: 0,
    approvalRate: 0,
    score: null as number | null,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const opsRes = await api.get('/operations?page=1&perPage=10');
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      if (!Array.isArray(ops)) { setLoading(false); return; }
      setOperations(ops.slice(0, 5));
      const active = ops.filter((o) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'].includes(o.status)).length;
      const approved = ops.filter((o) => o.status === 'COMPLETED').length;
      const proposals = ops.reduce((a, o) => a + (o._count?.proposals ?? 0), 0);
      const volume = ops.reduce((a, o) => a + (o.requestedAmount ?? 0), 0);
      setStats({
        totalOps: ops.length,
        activeOps: active,
        proposals,
        approvedOps: approved,
        totalVolume: volume,
        avgTicket: ops.length > 0 ? volume / ops.length : 0,
        approvalRate: ops.length > 0 ? Math.round((approved / ops.length) * 100) : 0,
        score: null,
      });
    } catch { /* new user */ } finally { setLoading(false); }
  }

  const scoreLabel = stats.score === null ? 'Calculando...' : stats.score >= 700 ? 'Excelente' : stats.score >= 500 ? 'Bom' : 'Regular';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Crédito sem limites</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Sparkles className="h-3 w-3" /> PRO
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Análise avançada e operações ilimitadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/analytics" className="btn-secondary text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </Link>
          <Link href="/dashboard/operations" className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Operação
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Score Premium"
          value={stats.score !== null ? stats.score : '—'}
          subtitle={scoreLabel}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Operações Ativas"
          value={stats.activeOps}
          subtitle="sem limite de uso"
          icon={<Activity className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Propostas Recebidas"
          value={stats.proposals}
          subtitle="de parceiros financeiros"
          icon={<CreditCard className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Volume Solicitado"
          value={formatCurrency(stats.totalVolume)}
          subtitle={`${stats.totalOps} operações`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Analytics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Ticket Médio',
            value: stats.avgTicket > 0 ? formatCurrency(stats.avgTicket) : '—',
            icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
            bg: 'bg-blue-50 dark:bg-blue-950/20',
            text: 'text-blue-700 dark:text-blue-300',
          },
          {
            label: 'Taxa de Aprovação',
            value: stats.totalOps > 0 ? `${stats.approvalRate}%` : '—',
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            bg: 'bg-green-50 dark:bg-green-950/20',
            text: 'text-green-700 dark:text-green-300',
          },
          {
            label: 'Operações Concluídas',
            value: stats.approvedOps,
            icon: <Clock className="h-5 w-5 text-purple-500" />,
            bg: 'bg-purple-50 dark:bg-purple-950/20',
            text: 'text-purple-700 dark:text-purple-300',
          },
        ].map((m) => (
          <div key={m.label} className={`card flex items-center gap-4 ${m.bg}`}>
            <div>{m.icon}</div>
            <div>
              <p className={`text-xl font-bold ${m.text}`}>{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Operações Recentes</h3>
            <Link href="/dashboard/operations" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}</div>
          ) : operations.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-14 w-14" />}
              title="Nenhuma operação ainda"
              description="Crie sua primeira operação e conecte-se a parceiros financeiros sem limites."
              action={{ label: 'Criar Operação', onClick: () => router.push('/dashboard/operations') }}
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
                    <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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

        {/* Right */}
        <div className="space-y-5">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
            <div className="space-y-1.5">
              {[
                { href: '/dashboard/operations', icon: <Plus className="h-4 w-4 text-blue-600" />,   label: 'Nova Operação',     bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { href: '/dashboard/documents',  icon: <FileText className="h-4 w-4 text-green-600" />, label: 'Documentos',      bg: 'bg-green-50 dark:bg-green-950/30' },
                { href: '/dashboard/scoring',    icon: <BarChart3 className="h-4 w-4 text-purple-600" />, label: 'Score Premium', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { href: '/dashboard/analytics',  icon: <TrendingUp className="h-4 w-4 text-blue-600" />, label: 'Analytics',     bg: 'bg-blue-50 dark:bg-blue-950/30' },
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

          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Powered by PRO</p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">Você tem acesso a score premium, analytics avançado e operações ilimitadas. Aproveite ao máximo.</p>
            <Link href="/dashboard/analytics" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline">
              Explorar Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
