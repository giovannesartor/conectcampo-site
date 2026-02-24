'use client';

/**
 * Dashboard — Cooperativa
 * Role: COMPANY, Plan: COOPERATIVE
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatCurrency, formatRelative } from '@/lib/format';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import {
  Plus,
  FileText,
  Users,
  Download,
  TrendingUp,
  Activity,
  CreditCard,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Circle,
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
}

type Tab = 'operacoes' | 'cooperados';

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${part}, ${name.split(' ')[0]}!` : `${part}!`;
}

export function DashboardCooperative() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('operacoes');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOps: 0,
    activeOps: 0,
    approvedOps: 0,
    totalVolume: 0,
    approvedVolume: 0,
    pendingOps: 0,
    docs: 0,
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const opsRes = await api.get('/operations?page=1&perPage=50');
      const ops: Operation[] = opsRes.data.data ?? opsRes.data.operations ?? opsRes.data ?? [];
      if (!Array.isArray(ops)) { setLoading(false); setRefreshing(false); return; }
      setOperations(ops);

      const active = ops.filter((o) => !['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'].includes(o.status)).length;
      const approved = ops.filter((o) => o.status === 'COMPLETED').length;
      const pending = ops.filter((o) => ['SUBMITTED', 'UNDER_REVIEW'].includes(o.status)).length;
      const volume = ops.reduce((a, o) => a + (o.amount ?? 0), 0);
      const approvedVol = ops.filter((o) => o.status === 'COMPLETED').reduce((a, o) => a + (o.amount ?? 0), 0);

      setStats({ totalOps: ops.length, activeOps: active, approvedOps: approved, totalVolume: volume, approvedVolume: approvedVol, pendingOps: pending, docs: 0 });
    } catch { /* new user */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    if (operations.length === 0) return;
    const headers = ['ID', 'Tipo', 'Status', 'Valor (R$)', 'Prazo (meses)', 'Finalidade', 'Produtor', 'Criado em'];
    const rows = operations.map((op) => [
      op.id,
      op.type,
      op.status,
      op.amount?.toFixed(2) ?? '0.00',
      op.termMonths ?? '',
      `"${(op.purpose ?? '').replace(/"/g, '""')}"`,
      `"${(op.producerName ?? '').replace(/"/g, '""')}"`,
      op.createdAt ? new Date(op.createdAt).toLocaleDateString('pt-BR') : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operacoes-cooperativa-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const onboardingSteps = [
    { done: !!user?.name, label: 'Completar perfil', href: '/dashboard/settings' },
    { done: stats.docs > 0, label: 'Enviar documentos', href: '/dashboard/documents' },
    { done: stats.totalOps > 0, label: 'Criar primeira operação', href: '/dashboard/operations/new' },
    { done: stats.approvedOps > 0, label: 'Ter operação aprovada', href: '/dashboard/operations' },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/40">
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{greeting(user?.name)}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/40 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
                <Users className="h-3 w-3" /> Cooperativa
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Operações da cooperativa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing} className="btn-ghost flex items-center gap-1.5 text-sm" title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={operations.length === 0} className="btn-secondary text-sm flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <Link href="/dashboard/operations/new" className="btn-primary text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova Operação
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Operações Ativas" value={stats.activeOps} subtitle="em andamento" icon={<Activity className="h-6 w-6" />} color="green" />
        <KPICard title="Aguardando Análise" value={stats.pendingOps} subtitle="submetidas ou em revisão" icon={<FileText className="h-6 w-6" />} color="amber" />
        <KPICard title="Operações Aprovadas" value={stats.approvedOps} subtitle="concluídas" icon={<CreditCard className="h-6 w-6" />} color="blue" />
        <KPICard title="Volume Total" value={formatCurrency(stats.totalVolume)} subtitle={`${stats.totalOps} operações`} icon={<TrendingUp className="h-6 w-6" />} color="purple" />
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5 w-fit">
          {(['operacoes', 'cooperados'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              {t === 'operacoes' ? 'Operações' : 'Cooperados'}
            </button>
          ))}
        </div>

        {tab === 'operacoes' ? (
          loading ? (
            <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />)}</div>
          ) : operations.length === 0 ? (
            <div className="space-y-3 py-1">
              <div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>{onboardingDone}/{onboardingSteps.length} concluídos</span>
                  <span>{Math.round((onboardingDone / onboardingSteps.length) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(onboardingDone / onboardingSteps.length) * 100}%` }} />
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                    <th className="pb-3 font-medium">Operação</th>
                    <th className="pb-3 font-medium">Produtor</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                  {operations.map((op) => (
                    <tr key={op.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900 dark:text-white">{op.purpose ?? op.type}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{op.termMonths}m</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{op.producerName ?? '—'}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{formatCurrency(op.amount)}</td>
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
          )
        ) : (
          /* Cooperados tab — under development */
          <div className="text-center py-12 px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-950/20">
              <Users className="h-7 w-7 text-green-500" />
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Gestão de Cooperados</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              O módulo de cooperados está em desenvolvimento e será disponibilizado em breve. Acompanhe as atualizações da plataforma.
            </p>
            <span className="mt-4 inline-block text-xs text-gray-400 dark:text-gray-500">Previsão: Q3 2025</span>
          </div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Volume Aprovado', value: formatCurrency(stats.approvedVolume), icon: <BarChart3 className="h-5 w-5 text-green-500" />, bg: 'bg-green-50 dark:bg-green-950/20' },
          { label: 'Volume em Análise', value: formatCurrency(stats.totalVolume - stats.approvedVolume), icon: <BarChart3 className="h-5 w-5 text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-950/20' },
          { label: 'Total de Operações', value: stats.totalOps, icon: <Activity className="h-5 w-5 text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-950/20' },
        ].map((m) => (
          <div key={m.label} className={`card flex items-center gap-4 ${m.bg}`}>
            <div>{m.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
