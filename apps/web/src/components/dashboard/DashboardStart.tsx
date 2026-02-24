'use client';

/**
 * Dashboard — Produtor Rural (Plano START)
 * Role: PRODUCER
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/format';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import {
  Plus,
  FileText,
  BarChart3,
  ArrowRight,
  Zap,
  LockKeyhole,
  TrendingUp,
  Sprout,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Circle,
  Bell,
  User,
} from 'lucide-react';

const MAX_OPERATIONS = 2;

interface Operation {
  id: string;
  type: string;
  status: string;
  amount: number;
  termMonths: number;
  purpose: string;
  createdAt: string;
  _count?: { proposals: number };
}

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${part}, ${name.split(' ')[0]}!` : `${part}!`;
}

export function DashboardStart() {
  const { user } = useAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOps: 0,
    activeOps: 0,
    proposals: 0,
    newProposals: 0,
    docs: 0,
    score: null as number | null,
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const opsRes = await api.get('/operations?page=1&perPage=5');
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      const safeOps = Array.isArray(ops) ? ops : [];
      setOperations(safeOps);

      const active = safeOps.filter((o) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'].includes(o.status)).length;
      const proposals = safeOps.reduce((a, o) => a + (o._count?.proposals ?? 0), 0);
      const newProposals = safeOps.filter((o) => (o._count?.proposals ?? 0) > 0 && !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(o.status)).length;

      let score: number | null = null;
      if (safeOps.length > 0) {
        try {
          const scoreRes = await api.get(`/scoring/${safeOps[0].id}`);
          score = scoreRes.data?.totalScore ?? null;
        } catch { /* score not calculated yet */ }
      }

      setStats({ totalOps: safeOps.length, activeOps: active, proposals, newProposals, docs: 0, score });
    } catch { /* new user */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const atLimit = stats.totalOps >= MAX_OPERATIONS;

  const scoreLabel = stats.score === null ? '—'
    : stats.score >= 80 ? 'Excelente'
    : stats.score >= 60 ? 'Bom'
    : stats.score >= 40 ? 'Regular'
    : 'Baixo';

  const pendencies = [
    !user?.phone && { key: 'phone', icon: <User className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />, title: 'Complete seu perfil', desc: 'Adicione telefone para receber notificações de propostas', color: 'yellow' },
    stats.docs === 0 && { key: 'docs', icon: <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />, title: 'Documentos pendentes', desc: 'Envie DRE, Balanço ou certidões para melhorar seu score', color: 'blue' },
    stats.score === null && stats.totalOps > 0 && { key: 'score', icon: <BarChart3 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />, title: 'Calcule seu score', desc: 'Acesse Score & Rating e clique em Calcular Score', color: 'purple' },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; title: string; desc: string; color: string }[];

  const onboardingSteps = [
    { done: !!user?.name, label: 'Completar perfil', href: '/dashboard/settings' },
    { done: stats.docs > 0, label: 'Enviar documentos', href: '/dashboard/documents' },
    { done: stats.totalOps > 0, label: 'Criar primeira operação', href: '/dashboard/operations/new' },
    { done: stats.proposals > 0, label: 'Receber proposta', href: '/dashboard/proposals' },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/40">
            <Sprout className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{greeting(user?.name)}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe suas operações em tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing} className="btn-ghost flex items-center gap-1.5 text-sm" title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/dashboard/operations/new" className={`btn-primary text-sm flex items-center gap-2 ${atLimit ? 'opacity-50 pointer-events-none' : ''}`}>
            <Plus className="h-4 w-4" /> Nova Operação
          </Link>
        </div>
      </div>

      {/* Limit banner */}
      {atLimit && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-5 py-4">
          <LockKeyhole className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Limite de operações atingido</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">O plano START permite até 2 operações. Faça upgrade para operações ilimitadas.</p>
          </div>
          <Link href="/dashboard/subscription" className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors">
            Fazer Upgrade →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Score ConectCampo" value={stats.score !== null ? stats.score : '—'} subtitle={scoreLabel} icon={<BarChart3 className="h-6 w-6" />} color="green" />
        <KPICard title="Operações Ativas" value={`${stats.activeOps}/${MAX_OPERATIONS}`} subtitle={atLimit ? 'Limite atingido' : 'em andamento'} icon={<FileText className="h-6 w-6" />} color={atLimit ? 'amber' : 'blue'} />
        <KPICard title="Propostas Recebidas" value={stats.proposals} subtitle={stats.newProposals > 0 ? `${stats.newProposals} aguardando resposta` : 'de parceiros'} icon={<CreditCard className="h-6 w-6" />} color="purple" />
        <KPICard title="Docs Enviados" value={stats.docs} subtitle="documentos enviados" icon={<TrendingUp className="h-6 w-6" />} color="amber" />
      </div>

      {/* Plan usage */}
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
              <div className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${Math.min((stats.totalOps / MAX_OPERATIONS) * 100, 100)}%` }} />
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
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {operations.length === 0 && !loading ? 'Primeiros passos' : 'Operações Recentes'}
            </h3>
            {operations.length > 0 && (
              <Link href="/dashboard/operations" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}</div>
          ) : operations.length === 0 ? (
            <div className="space-y-3 py-1">
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>{onboardingDone}/{onboardingSteps.length} concluídos</span>
                  <span>{Math.round((onboardingDone / onboardingSteps.length) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(onboardingDone / onboardingSteps.length) * 100}%` }} />
                </div>
              </div>
              {onboardingSteps.map((s) => (
                <Link key={s.label} href={s.href} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${s.done ? 'border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20' : 'border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                  {s.done ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" /> : <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                  <span className={`text-sm font-medium flex-1 ${s.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{s.label}</span>
                  {!s.done && <ArrowRight className="h-4 w-4 text-gray-400" />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {operations.map((op) => (
                <div key={op.id} onClick={() => router.push(`/dashboard/operations/${op.id}`)} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{op.purpose ?? op.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(op.amount)} · {op.termMonths}m · {formatRelative(op.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(op._count?.proposals ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/30 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                        <Bell className="h-3 w-3" /> {op._count!.proposals}
                      </span>
                    )}
                    <StatusBadge status={op.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Ações Rápidas</h3>
            <div className="space-y-1.5">
              {[
                { href: '/dashboard/operations/new', icon: <Plus className="h-4 w-4 text-blue-600" />,    label: 'Solicitar Crédito',  bg: 'bg-blue-50 dark:bg-blue-950/30',   disabled: atLimit },
                { href: '/dashboard/documents',      icon: <FileText className="h-4 w-4 text-green-600" />,  label: 'Enviar Documentos', bg: 'bg-green-50 dark:bg-green-950/30' },
                { href: '/dashboard/scoring',        icon: <BarChart3 className="h-4 w-4 text-purple-600" />, label: 'Ver Meu Score',    bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { href: '/dashboard/subscription',   icon: <Zap className="h-4 w-4 text-amber-600" />,      label: 'Fazer Upgrade →',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
              ].map((a) => (
                <Link key={a.label} href={a.disabled ? '#' : a.href} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${a.disabled ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <div className={`h-8 w-8 rounded-lg ${a.bg} flex items-center justify-center`}>{a.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {pendencies.length > 0 && (
            <div className="card">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Pendências</h3>
              <div className="space-y-2.5">
                {pendencies.map((p) => {
                  const colors: Record<string, string> = {
                    yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/30',
                    blue:   'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30',
                    purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30',
                  };
                  const title: Record<string, string> = {
                    yellow: 'text-yellow-800 dark:text-yellow-300',
                    blue:   'text-blue-800 dark:text-blue-300',
                    purple: 'text-purple-800 dark:text-purple-300',
                  };
                  const desc: Record<string, string> = {
                    yellow: 'text-yellow-600 dark:text-yellow-400',
                    blue:   'text-blue-600 dark:text-blue-400',
                    purple: 'text-purple-600 dark:text-purple-400',
                  };
                  return (
                    <div key={p.key} className={`flex items-start gap-2.5 p-3 rounded-lg border ${colors[p.color]}`}>
                      {p.icon}
                      <div>
                        <p className={`text-xs font-semibold ${title[p.color]}`}>{p.title}</p>
                        <p className={`text-xs mt-0.5 ${desc[p.color]}`}>{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
