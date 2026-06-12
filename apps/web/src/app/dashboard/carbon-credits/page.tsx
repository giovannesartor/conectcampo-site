'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Leaf,
  TrendingUp,
  Award,
  BarChart2,
  Plus,
  ArrowRight,
  Globe,
  Flame,
  DollarSign,
  TreePine,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Percent,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  totalCreditsIssued: number;
  totalCreditsRetired: number;
  totalRevenueEstimated: number;
  totalCO2ProjectedPerYear: number;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  status: string;
  projectType: string;
  standard: string;
  eligibleAreaHa: number;
  projectedReduction: number;
  estimatedCreditPrice: number | null;
  totalEstimatedRevenue: number | null;
  _count: { credits: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:           { label: 'Rascunho',      color: 'text-gray-500 bg-gray-100 dark:bg-gray-800',        icon: <Clock className="h-3 w-3" /> },
  IN_VALIDATION:   { label: 'Em Validação',   color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30', icon: <Clock className="h-3 w-3" /> },
  VALIDATED:       { label: 'Validado',        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',      icon: <CheckCircle2 className="h-3 w-3" /> },
  REGISTERED:      { label: 'Registrado',      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',      icon: <CheckCircle2 className="h-3 w-3" /> },
  MONITORING:      { label: 'Monitorando',     color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30', icon: <BarChart2 className="h-3 w-3" /> },
  VERIFIED:        { label: 'Verificado',       color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', icon: <CheckCircle2 className="h-3 w-3" /> },
  ACTIVE:          { label: 'Ativo',           color: 'text-green-600 bg-green-50 dark:bg-green-950/30',    icon: <CheckCircle2 className="h-3 w-3" /> },
  COMPLETED:       { label: 'Concluído',        color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',        icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED:       { label: 'Cancelado',        color: 'text-red-600 bg-red-50 dark:bg-red-950/30',         icon: <AlertCircle className="h-3 w-3" /> },
  SUSPENDED:       { label: 'Suspenso',         color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30', icon: <AlertCircle className="h-3 w-3" /> },
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  FLORESTA_NATIVA:     'Floresta Nativa',
  REFLORESTATION:      'Reflorestamento',
  PASTAGEM_RECUPERADA: 'Pastagem Recuperada',
  INTEGRACAO_LAVOURA:  'Integração Lavoura-Pecuária',
  AGRICULTURA_CARBONO: 'Agricultura Baixo Carbono',
  BIODIGESTAO:         'Biodigestão',
  ENERGIA_RENOVAVEL:   'Energia Renovável',
  MANEJO_SOLO:         'Manejo de Solo',
  OUTRO:               'Outro',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'emerald' | 'amber';
}) {
  const colors = {
    green:   'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
    blue:    'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function CarbonCreditsDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/carbon-credits/dashboard')
      .then((r) => setSummary(r.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crédito de Carbono</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Planeje, monitore e comercialize seus créditos de carbono.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/carbon-credits/mercado" className="btn-secondary text-sm">
            <Globe className="h-4 w-4 mr-2" />
            Mercado
          </Link>
          <Link href="/dashboard/carbon-credits/projects/new" className="btn-primary text-sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Link>
        </div>
      </div>

      {/* Banner informativo */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5">
        <div className="flex items-start gap-4">
          <TreePine className="h-8 w-8 text-emerald-600 shrink-0" />
          <div>
            <h2 className="font-semibold text-emerald-900 dark:text-emerald-200">Como funciona o Crédito de Carbono no ConectCampo</h2>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
              Registre suas práticas sustentáveis (floresta nativa, pastagem recuperada, plantio direto, energia renovável e mais),
              calcule a redução de CO₂, obtenha certificação por padrões internacionais como Verra VCS e Gold Standard,
              e comercialize créditos no mercado voluntário gerando receita adicional para sua propriedade.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Verra VCS</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Gold Standard</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Protocolo Cerrado</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> ABC+ (Agricultura)</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> REDD+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Precificação da plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
            <Receipt className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-0.5">Taxa de Setup</p>
            <p className="text-2xl font-bold text-violet-900 dark:text-violet-200">R$&nbsp;5.000</p>
            <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
              Paga uma única vez na ativação do projeto. Cobre onboarding técnico, validação inicial e suporte dedicado ao processo de certificação.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500 dark:text-emerald-400 mb-0.5">Comiss\u00e3o ConectCampo</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">6%</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              Incide apenas sobre a receita efetivamente gerada na comercializa\u00e7\u00e3o dos cr\u00e9ditos. Sem receita, sem custo.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Projetos"
          value={summary?.totalProjects ?? 0}
          subtitle={`${summary?.activeProjects ?? 0} ativos`}
          icon={<TreePine className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Créditos Emitidos"
          value={`${(summary?.totalCreditsIssued ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e`}
          subtitle={`${(summary?.totalCreditsRetired ?? 0).toFixed(2)} tCO₂e aposentados`}
          icon={<Award className="h-5 w-5" />}
          color="emerald"
        />
        <KPICard
          title="CO₂ Projetado/ano"
          value={`${(summary?.totalCO2ProjectedPerYear ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} tCO₂e`}
          subtitle="Redução anual estimada"
          icon={<Flame className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Receita Estimada"
          value={formatCurrency(summary?.totalRevenueEstimated ?? 0)}
          subtitle="Total projetado do portfólio"
          icon={<DollarSign className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {/* Dois painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de projetos */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meus Projetos</h3>
              <Link
                href="/dashboard/carbon-credits/projects"
                className="text-sm text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {!summary || summary.projects.length === 0 ? (
              <div className="text-center py-12">
                <TreePine className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum projeto criado ainda</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Crie seu primeiro projeto para começar a gerar créditos de carbono.
                </p>
                <Link href="/dashboard/carbon-credits/projects/new" className="btn-primary text-sm mt-4 inline-flex">
                  <Plus className="h-4 w-4 mr-2" /> Criar Projeto
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.projects.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/carbon-credits/projects/${p.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {PROJECT_TYPE_LABELS[p.projectType] ?? p.projectType}
                          {' · '}
                          {Number(p.eligibleAreaHa).toLocaleString('pt-BR')} ha
                          {' · '}
                          {Number(p.projectedReduction).toLocaleString('pt-BR')} tCO₂e/ano
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p._count.credits > 0 && (
                        <span className="text-xs text-gray-400">{p._count.credits} créditos</span>
                      )}
                      <StatusBadge status={p.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ações rápidas + etapas */}
        <div className="space-y-6">
          {/* Ações rápidas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/carbon-credits/projects/new',  icon: <Plus className="h-4 w-4 text-emerald-600" />,  label: 'Novo Projeto',       bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { href: '/dashboard/carbon-credits/projects',      icon: <TreePine className="h-4 w-4 text-blue-600" />, label: 'Meus Projetos',      bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { href: '/dashboard/carbon-credits/mercado',       icon: <Globe className="h-4 w-4 text-teal-600" />,   label: 'Preços de Mercado',  bg: 'bg-teal-50 dark:bg-teal-950/30' },
                { href: '/dashboard/carbon-credits/projects',      icon: <Award className="h-4 w-4 text-amber-600" />,  label: 'Emitir Créditos',    bg: 'bg-amber-50 dark:bg-amber-950/30' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg ${action.bg} flex items-center justify-center`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Jornada do projeto */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Jornada do Projeto</h3>
            <ol className="space-y-3">
              {[
                { step: '1', label: 'Cadastro do Projeto',   desc: 'Área, tipo, padrão e baseline' },
                { step: '2', label: 'Inventário de Emissões', desc: 'Medição anual de CO₂ reduzido' },
                { step: '3', label: 'Validação / Verificação', desc: 'Entidade certificadora externa' },
                { step: '4', label: 'Emissão de Créditos',   desc: 'Créditos tCO₂e registrados' },
                { step: '5', label: 'Comercialização',        desc: 'Venda no mercado voluntário' },
              ].map((s) => (
                <li key={s.step} className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
