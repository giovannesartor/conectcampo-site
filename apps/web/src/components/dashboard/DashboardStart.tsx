'use client';

/**
 * Dashboard — Produtor Rural (Plano START)
 * Role: PRODUCER
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
  Zap,
  AlertTriangle,
  Clock,
  LockKeyhole,
  TrendingUp,
  Sprout,
  CreditCard,
} from 'lucide-react';

const MAX_OPERATIONS = 2;

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

export function DashboardStart() {
  const { user } = useAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOps: 0,
    activeOps: 0,
    proposals: 0,
    docs: 0,
    score: null as number | null,
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [opsRes] = await Promise.all([
        api.get('/operations?page=1&perPage=5'),
      ]);
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      setOperations(Array.isArray(ops) ? ops : []);
      const active = ops.filter((o) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'].includes(o.status)).length;
      const proposals = ops.reduce((a, o) => a + (o._count?.proposals ?? 0), 0);
      setStats({ totalOps: ops.length, activeOps: active, proposals, docs: 0, score: null });
    } catch { /* new user */ } finally { setLoading(false); }
  }

  const atLimit = stats.totalOps >= MAX_OPERATIONS;
  const scoreLabel = stats.score === null ? '—' : stats.score >= 700 ? 'Excelente' : stats.score >= 500 ? 'Bom' : 'Regular';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/40">
            <Sprout className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Seu crédito agro</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe suas operações em tempo real</p>
          </div>
        </div>
        <Link
          href="/dashboard/operations"
          className={`btn-primary text-sm flex items-center gap-2 ${atLimit ? 'opacity-50 pointer-events-none' : ''}`}
          title={atLimit ? 'Limite de operações atingido' : undefined}
        >
          <Plus className="h-4 w-4" /> Nova Operação
        </Link>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-5 py-4">
          <LockKeyhole className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Limite de operações atingido</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">O plano START permite até 2 operações simultâneas. Faça upgrade para operações ilimitadas.</p>
          </div>
          <Link href="/dashboard/subscription" className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
            Fazer Upgrade →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Score ConectCampo"
          value={stats.score !== null ? stats.score : '—'}
          subtitle={scoreLabel}
          icon={<BarChart3 className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Operações Ativas"
          value={`${stats.activeOps}/${MAX_OPERATIONS}`}
          subtitle={atLimit ? 'Limite atingido' : 'slots disponíveis'}
          icon={<FileText className="h-6 w-6" />}
          color={atLimit ? 'amber' : 'blue'}
        />
        <KPICard
          title="Propostas Recebidas"
          value={stats.proposals}
          subtitle="de instituições parceiras"
          icon={<CreditCard className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Docs Enviados"
          value={stats.docs}
          subtitle="documentos aprovados"
          icon={<TrendingUp className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Ops limit progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Uso do Plano START</p>
          <Link href="/dashboard/subscription" className="text-xs text-brand-600 hover:underline">Ver plano</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Operações simultâneas</span>
              <span className={atLimit ? 'font-bold text-amber-600' : ''}>{stats.totalOps}/{MAX_OPERATIONS}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min((stats.totalOps / MAX_OPERATIONS) * 100, 100)}%` }}
              />
            </div>
          </div>
          {atLimit && (
            <Link href="/dashboard/subscription" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-500 flex-shrink-0">
              <Zap className="h-3.5 w-3.5" /> Upgrade PRO
            </Link>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Operações', value: `${stats.totalOps}/${MAX_OPERATIONS}`, locked: false },
            { label: 'Analytics', value: 'Bloqueado', locked: true },
            { label: 'Score Premium', value: 'Bloqueado', locked: true },
          ].map((f) => (
            <div key={f.label} className={`rounded-lg p-2.5 text-xs ${f.locked ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-brand-50 dark:bg-brand-950/20'}`}>
              <p className={`font-semibold ${f.locked ? 'text-gray-400' : 'text-brand-700 dark:text-brand-400'}`}>
                {f.locked ? <LockKeyhole className="h-3.5 w-3.5 mx-auto" /> : f.value}
              </p>
              <p className="text-gray-500 dark:text-gray-500 mt-0.5">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations list */}
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
              description="Crie sua primeira operação e conecte-se a dezenas de instituições parceiras."
              action={{ label: 'Criar Primeira Operação', onClick: () => router.push('/dashboard/operations') }}
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
                    <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
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

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
            <div className="space-y-1.5">
              {[
                { href: '/dashboard/operations', icon: <Plus className="h-4 w-4 text-blue-600" />,   label: 'Solicitar Crédito',   bg: 'bg-blue-50 dark:bg-blue-950/30',   disabled: atLimit },
                { href: '/dashboard/documents',  icon: <FileText className="h-4 w-4 text-green-600" />, label: 'Enviar Documentos', bg: 'bg-green-50 dark:bg-green-950/30' },
                { href: '/dashboard/scoring',    icon: <BarChart3 className="h-4 w-4 text-purple-600" />, label: 'Ver Meu Score',  bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { href: '/dashboard/subscription', icon: <Zap className="h-4 w-4 text-amber-600" />, label: 'Fazer Upgrade →',    bg: 'bg-amber-50 dark:bg-amber-950/30' },
              ].map((a) => (
                <Link
                  key={a.href + a.label}
                  href={a.disabled ? '#' : a.href}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${a.disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className={`h-8 w-8 rounded-lg ${a.bg} flex items-center justify-center`}>{a.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Pendências</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">Complete seu perfil</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Dados do produtor necessários para solicitar crédito</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Documentos pendentes</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Envie DRE, Balanço e certidões</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
