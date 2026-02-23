'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CreditCard, PieChart } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { formatCurrency, formatDate } from '@/lib/format';
import { api } from '@/lib/api';

export default function AdminRevenuePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadRevenue();
  }, [user]);

  async function loadRevenue() {
    try {
      const { data } = await api.get('/admin/revenue');
      setRevenue(data);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  const totalCommissions = revenue?.commissions?.reduce((acc: number, c: any) => acc + (c._sum?.amount || 0), 0) || 0;
  const paidCommissions = revenue?.commissions?.find((c: any) => c.status === 'PAID')?._sum?.amount || 0;
  const pendingCommissions = revenue?.commissions?.find((c: any) => c.status === 'PENDING')?._sum?.amount || 0;
  const totalSubscriptions = revenue?.subscriptions?.reduce((acc: number, s: any) => acc + (s._count?._all || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receita & Comissões</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Acompanhamento financeiro da plataforma</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Comissões"
              value={formatCurrency(totalCommissions)}
              icon={<DollarSign className="h-6 w-6" />}
              color="green"
              subtitle="Todas as comissões"
            />
            <KPICard
              title="Comissões Pagas"
              value={formatCurrency(paidCommissions)}
              icon={<TrendingUp className="h-6 w-6" />}
              color="blue"
              subtitle="Status: PAID"
            />
            <KPICard
              title="Comissões Pendentes"
              value={formatCurrency(pendingCommissions)}
              icon={<CreditCard className="h-6 w-6" />}
              color="amber"
              subtitle="Aguardando pagamento"
            />
            <KPICard
              title="Assinaturas"
              value={String(totalSubscriptions)}
              icon={<PieChart className="h-6 w-6" />}
              color="purple"
              subtitle="Total de assinantes"
            />
          </div>

          {/* Commissions by status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comissões por Status</h3>
            <div className="space-y-3">
              {revenue?.commissions?.map((c: any, i: number) => {
                const amount = c._sum?.amount || 0;
                const count = c._count?._all || 0;
                const pct = totalCommissions > 0 ? (amount / totalCommissions) * 100 : 0;
                const statusLabels: Record<string, string> = {
                  PENDING: 'Pendente',
                  PAID: 'Pago',
                  CANCELLED: 'Cancelado',
                };
                const statusColors: Record<string, string> = {
                  PENDING: 'bg-yellow-500',
                  PAID: 'bg-green-500',
                  CANCELLED: 'bg-red-500',
                };
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {statusLabels[c.status] || c.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {count} ({formatCurrency(amount)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${statusColors[c.status] || 'bg-gray-500'}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!revenue?.commissions || revenue.commissions.length === 0) && (
                <p className="text-gray-400 text-sm text-center py-4">Nenhuma comissão registrada</p>
              )}
            </div>
          </div>

          {/* Subscriptions by plan */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assinaturas por Plano</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {revenue?.subscriptions?.map((s: any, i: number) => {
                const planLabels: Record<string, string> = {
                  START: 'Produtor Rural',
                  PRO: 'Empresa',
                  COOPERATIVE: 'Cooperativa',
                  CORPORATE: 'Inst. Financeira',
                };
                const planColors: Record<string, string> = {
                  START: 'border-gray-200 dark:border-gray-700',
                  PRO: 'border-brand-200 dark:border-brand-900',
                  COOPERATIVE: 'border-amber-200 dark:border-amber-900',
                  CORPORATE: 'border-purple-200 dark:border-purple-900',
                };
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border-2 ${planColors[s.plan] || 'border-gray-200'} bg-white dark:bg-dark-card`}
                  >
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {planLabels[s.plan] || s.plan}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s._count?._all || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">assinantes</p>
                  </div>
                );
              })}
              {(!revenue?.subscriptions || revenue.subscriptions.length === 0) && (
                <p className="text-gray-400 text-sm text-center py-4 col-span-4">Nenhuma assinatura registrada</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
