'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  FileText,
  CreditCard,
  Users,
  Plus,
  TrendingUp,
  AlertTriangle,
  Clock,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatCurrency, formatRelative } from '@/lib/format';
import { api } from '@/lib/api';
import { DashboardStart } from '@/components/dashboard/DashboardStart';
import { DashboardPro } from '@/components/dashboard/DashboardPro';
import { DashboardCooperative } from '@/components/dashboard/DashboardCooperative';
import { DashboardCorporate } from '@/components/dashboard/DashboardCorporate';
import { Eye } from 'lucide-react';
import { usePreview } from '@/lib/preview-context';

const PREVIEW_OPTIONS = [
  { label: 'Admin',       color: 'bg-gray-800 text-white',          role: null as string | null, plan: null as string | null },
  { label: 'Produtor',    color: 'bg-emerald-600 text-white',        role: 'PRODUCER',            plan: 'START' },
  { label: 'Empresa',     color: 'bg-blue-600 text-white',           role: 'COMPANY',             plan: 'PRO' },
  { label: 'Cooperativa', color: 'bg-violet-600 text-white',         role: 'COMPANY',             plan: 'COOPERATIVE' },
  { label: 'Financeira',  color: 'bg-slate-600 text-white',          role: 'FINANCIAL_INSTITUTION', plan: 'CORPORATE' },
];

function AdminPreviewBar() {
  const { previewRole, previewPlan, setPreview } = usePreview();
  const activeLabel = !previewRole ? 'Admin'
    : previewRole === 'PRODUCER' ? 'Produtor'
    : previewPlan === 'COOPERATIVE' ? 'Cooperativa'
    : previewRole === 'COMPANY' ? 'Empresa'
    : 'Financeira';

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 shadow-sm">
      <Eye className="h-4 w-4 text-amber-600 flex-shrink-0" />
      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 mr-1">Preview Admin</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {PREVIEW_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setPreview(opt.role, opt.plan)}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-all ${
              activeLabel === opt.label
                ? opt.color + ' shadow'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Operation {
  id: string;
  type: string;
  status: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  createdAt: string;
  riskScore?: { score: number; profile: string };
  _count?: { proposals: number };
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { previewRole, previewPlan } = usePreview();
  const [plan, setPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Admin-only state
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [stats, setStats] = useState({
    totalOperations: 0,
    activeOperations: 0,
    totalProposals: 0,
    score: null as number | null,
  });

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    // Fetch plan for role-routing
    api.get('/subscriptions/me')
      .then((r) => setPlan(r.data?.plan ?? null))
      .catch(() => setPlan(null))
      .finally(() => setPlanLoading(false));
    // If ADMIN, also load dashboard data
    if (user.role === 'ADMIN') loadAdminDashboard();
  }, [user]);

  async function loadAdminDashboard() {
    setLoadingData(true);
    try {
      const { data } = await api.get('/operations?page=1&perPage=5');
      const ops = data.data || data.operations || data || [];
      setOperations(Array.isArray(ops) ? ops : []);
      const active = Array.isArray(ops) ? ops.filter((o: Operation) =>
        !['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'].includes(o.status)).length : 0;
      const proposals = Array.isArray(ops) ? ops.reduce(
        (acc: number, o: Operation) => acc + (o._count?.proposals || 0), 0) : 0;
      setStats({ totalOperations: data.meta?.total || (Array.isArray(ops) ? ops.length : 0), activeOperations: active, totalProposals: proposals, score: null });
    } catch { /* new */ } finally { setLoadingData(false); }
  }

  if (isLoading || planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  // ── Role router ──────────────────────────────────────────────
  if (user.role === 'FINANCIAL_INSTITUTION') return <DashboardCorporate />;
  if (user.role === 'COMPANY' && plan === 'COOPERATIVE') return <DashboardCooperative />;
  if (user.role === 'COMPANY') return <DashboardPro />;
  if (user.role === 'PRODUCER') return <DashboardStart />;

  // ── ADMIN: render preview or default ─────────────────────────────
  const isAdmin = user.role === 'ADMIN';
  if (isAdmin && previewRole) {
    const previewContent =
      previewRole === 'FINANCIAL_INSTITUTION' ? <DashboardCorporate /> :
      (previewRole === 'COMPANY' && previewPlan === 'COOPERATIVE') ? <DashboardCooperative /> :
      previewRole === 'COMPANY' ? <DashboardPro /> :
      previewRole === 'PRODUCER' ? <DashboardStart /> : null;
    if (previewContent) {
      return (
        <div className="space-y-4">
          <AdminPreviewBar />
          {previewContent}
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin preview bar */}
      {isAdmin && <AdminPreviewBar />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isAdmin
              ? 'Acesse o painel administrativo para gestão completa.'
              : 'Acompanhe suas operações de crédito agro.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/dashboard/admin" className="btn-secondary text-sm">
              <Shield className="h-4 w-4 mr-2" />
              Painel Admin
            </Link>
          )}
          <Link href="/dashboard/operations" className="btn-primary text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Operação
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Operações Ativas"
          value={stats.activeOperations}
          subtitle={`${stats.totalOperations} total`}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Score ConectCampo"
          value={stats.score !== null ? stats.score : '--'}
          subtitle={stats.score !== null ? (stats.score >= 70 ? 'Excelente' : stats.score >= 50 ? 'Bom' : 'Regular') : 'Complete seu perfil'}
          icon={<BarChart3 className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Propostas Recebidas"
          value={stats.totalProposals}
          icon={<CreditCard className="h-6 w-6" />}
          color="purple"
        />
        <KPICard
          title="Parceiros Match"
          value={0}
          subtitle="Parceiros compatíveis"
          icon={<Users className="h-6 w-6" />}
          color="amber"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent operations */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operações Recentes</h3>
              <Link href="/dashboard/operations" className="text-sm text-brand-600 hover:text-brand-500 flex items-center gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                ))}
              </div>
            ) : operations.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-16 w-16" />}
                title="Nenhuma operação ainda"
                description="Crie seu perfil de produtor e comece sua primeira operação de crédito."
                action={{
                  label: 'Criar Primeira Operação',
                  onClick: () => router.push('/dashboard/operations'),
                }}
              />
            ) : (
              <div className="space-y-3">
                {operations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/operations/${op.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {op.purpose || op.type}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(op.requestedAmount)} · {op.termMonths} meses · {formatRelative(op.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={op.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions & alerts */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/operations', icon: <Plus className="h-4 w-4 text-blue-600" />, label: 'Solicitar Crédito', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { href: '/dashboard/documents', icon: <FileText className="h-4 w-4 text-green-600" />, label: 'Enviar Documentos', bg: 'bg-green-50 dark:bg-green-950/30' },
                { href: '/dashboard/scoring', icon: <BarChart3 className="h-4 w-4 text-purple-600" />, label: 'Ver Meu Score', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { href: '/dashboard/subscription', icon: <TrendingUp className="h-4 w-4 text-amber-600" />, label: 'Minha Assinatura', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg ${action.bg} flex items-center justify-center`}>{action.icon}</div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pendências</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Complete seu perfil</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Preencha os dados do produtor para solicitar crédito</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Documentos pendentes</p>
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
