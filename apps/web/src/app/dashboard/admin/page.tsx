'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatRelative, formatNumber } from '@/lib/format';
import { api } from '@/lib/api';
import { RevenueAreaChart, OperationsBarChart, UsersPieChart, GMVChart } from '@/components/dashboard/AdminCharts';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadStats();
  }, [user]);

  async function loadStats() {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Visão consolidada da plataforma ConectCampo
          </p>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Usuários"
          value={formatNumber(stats?.totalUsers || 0)}
          subtitle={`${stats?.activeUsers || 0} ativos`}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Operações"
          value={formatNumber(stats?.totalOperations || 0)}
          icon={<FileText className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="GMV Total"
          value={formatCurrency(stats?.gmv || 0)}
          subtitle={`Ticket médio: ${formatCurrency(stats?.avgTicket || 0)}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Parceiros Ativos"
          value={formatNumber(stats?.totalPartners || 0)}
          icon={<Building2 className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Receita Comissões"
          value={formatCurrency(stats?.totalCommissions || 0)}
          subtitle="Total pago"
          icon={<TrendingUp className="h-6 w-6" />}
          color="cyan"
        />
        <KPICard
          title="Assinaturas Ativas"
          value={stats?.subscriptionsByPlan?.reduce((a: number, p: any) => a + p.count, 0) || 0}
          subtitle={stats?.subscriptionsByPlan?.map((p: any) => `${p.plan}: ${p.count}`).join(' · ') || 'Nenhuma'}
          icon={<Activity className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Ticket Médio"
          value={formatCurrency(stats?.avgTicket || 0)}
          icon={<BarChart3 className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Grid: users by role + operations by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usuários por Perfil</h3>
            <Link href="/dashboard/admin/users" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
              Gerenciar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.usersByRole || []).map((r: any) => (
              <div key={r.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.role} />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{r.count}</span>
              </div>
            ))}
            {(!stats?.usersByRole || stats.usersByRole.length === 0) && (
              <p className="text-sm text-gray-400">Nenhum usuário cadastrado</p>
            )}
          </div>
        </div>

        {/* Operations Pipeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pipeline de Operações</h3>
            <Link href="/dashboard/admin/operations" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.operationsByStatus || []).map((s: any) => {
              const total = stats?.totalOperations || 1;
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={s.status} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-brand-500 dark:bg-brand-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!stats?.operationsByStatus || stats.operationsByStatus.length === 0) && (
              <p className="text-sm text-gray-400">Nenhuma operação registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueAreaChart
          data={stats?.monthlyRevenue || [
            { month: 'Set', commissions: 12000, subscriptions: 4500 },
            { month: 'Out', commissions: 18000, subscriptions: 5200 },
            { month: 'Nov', commissions: 15000, subscriptions: 6100 },
            { month: 'Dez', commissions: 22000, subscriptions: 6800 },
            { month: 'Jan', commissions: 28000, subscriptions: 7500 },
            { month: 'Fev', commissions: 31000, subscriptions: 8200 },
          ]}
        />
        <OperationsBarChart
          data={stats?.operationsByStatus || []}
        />
        <UsersPieChart
          data={(stats?.usersByRole || []).map((r: any) => ({
            name: r.role,
            value: r.count,
          }))}
        />
        <GMVChart
          data={stats?.monthlyGMV || [
            { month: 'Set', volume: 8500000, count: 12 },
            { month: 'Out', volume: 12000000, count: 18 },
            { month: 'Nov', volume: 9800000, count: 15 },
            { month: 'Dez', volume: 15500000, count: 22 },
            { month: 'Jan', volume: 18200000, count: 28 },
            { month: 'Fev', volume: 21000000, count: 31 },
          ]}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Últimos Cadastros</h3>
          <div className="space-y-3">
            {(stats?.recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-sm font-bold">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={u.role} />
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(u.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Operations */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Últimas Operações</h3>
          <div className="space-y-3">
            {(stats?.recentOperations || []).map((op: any) => (
              <div key={op.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(op.requestedAmount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {op.userName} · {formatRelative(op.createdAt)}
                  </p>
                </div>
                <StatusBadge status={op.status} />
              </div>
            ))}
            {(!stats?.recentOperations || stats.recentOperations.length === 0) && (
              <p className="text-sm text-gray-400">Nenhuma operação registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Quick Links */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gestão da Plataforma</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/admin/users', icon: <Users className="h-5 w-5" />, label: 'Gestão de Usuários', desc: 'RBAC, aprovações, bloqueios', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' },
            { href: '/dashboard/admin/operations', icon: <FileText className="h-5 w-5" />, label: 'Pipeline Global', desc: 'Todas as operações da plataforma', color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600' },
            { href: '/dashboard/admin/partners', icon: <Building2 className="h-5 w-5" />, label: 'Parceiros Financeiros', desc: 'Bancos, FIDCs, onboarding', color: 'bg-green-50 dark:bg-green-950/30 text-green-600' },
            { href: '/dashboard/admin/revenue', icon: <DollarSign className="h-5 w-5" />, label: 'Receita & Financeiro', desc: 'Comissões, MRR, assinaturas', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 p-4 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className={`h-10 w-10 rounded-lg ${link.color} flex items-center justify-center shrink-0`}>
                {link.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{link.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
