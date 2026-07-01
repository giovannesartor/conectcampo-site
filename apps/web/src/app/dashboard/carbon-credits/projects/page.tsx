'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Leaf,
  Plus,
  TreePine,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart2,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { EmptyState } from '@/components/dashboard/EmptyState';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  projectType: string;
  standard: string;
  state: string;
  city: string;
  eligibleAreaHa: number;
  projectedReduction: number;
  estimatedCreditPrice: number | null;
  totalEstimatedRevenue: number | null;
  createdAt: string;
  _count: { credits: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Rascunho',      color: 'text-gray-500 bg-gray-100 dark:bg-gray-800',            icon: <Clock className="h-3 w-3" /> },
  IN_VALIDATION:  { label: 'Em Validação',  color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',    icon: <Clock className="h-3 w-3" /> },
  VALIDATED:      { label: 'Validado',      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',          icon: <CheckCircle2 className="h-3 w-3" /> },
  REGISTERED:     { label: 'Registrado',    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',          icon: <CheckCircle2 className="h-3 w-3" /> },
  MONITORING:     { label: 'Monitorando',   color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30',    icon: <BarChart2 className="h-3 w-3" /> },
  VERIFIED:       { label: 'Verificado',    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', icon: <CheckCircle2 className="h-3 w-3" /> },
  ACTIVE:         { label: 'Ativo',         color: 'text-green-600 bg-green-50 dark:bg-green-950/30',       icon: <CheckCircle2 className="h-3 w-3" /> },
  COMPLETED:      { label: 'Concluído',     color: 'text-gray-600 bg-gray-100 dark:bg-gray-800',            icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED:      { label: 'Cancelado',     color: 'text-red-600 bg-red-50 dark:bg-red-950/30',             icon: <AlertCircle className="h-3 w-3" /> },
};

const TYPE_LABELS: Record<string, string> = {
  FLORESTA_NATIVA:     'Floresta Nativa',
  REFLORESTATION:      'Reflorestamento',
  PASTAGEM_RECUPERADA: 'Pastagem Recuperada',
  INTEGRACAO_LAVOURA:  'ILPF',
  AGRICULTURA_CARBONO: 'Agricultura Baixo Carbono',
  BIODIGESTAO:         'Biodigestão',
  ENERGIA_RENOVAVEL:   'Energia Renovável',
  MANEJO_SOLO:         'Manejo de Solo',
  OUTRO:               'Outro',
};

const STANDARD_LABELS: Record<string, string> = {
  VERRA_VCS:        'Verra VCS',
  GOLD_STANDARD:    'Gold Standard',
  CERRADO_PROTOCOL: 'Cerrado',
  AMAZON_FUND:      'Fundo Amazônia',
  REDD_PLUS:        'REDD+',
  CAR_REGISTRY:     'CAR',
  OUTRO:            'Outro',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function CarbonProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/carbon-credits/projects?page=1&perPage=20')
      .then((r) => {
        setProjects(r.data.data ?? []);
        setTotal(r.data.meta?.total ?? 0);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/carbon-credits" className="hover:text-emerald-600">Carbono</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Projetos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Projetos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{total} projeto{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/carbon-credits/projects/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4 mr-2" /> Novo Projeto
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={TreePine}
          title="Nenhum projeto ainda"
          description="Cadastre seu primeiro projeto de carbono para medir reduções de CO₂ e emitir créditos."
          actionLabel="Criar primeiro projeto"
          onAction={() => router.push('/dashboard/carbon-credits/projects/new')}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/carbon-credits/projects/${p.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                    <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {TYPE_LABELS[p.projectType] ?? p.projectType} · {STANDARD_LABELS[p.standard] ?? p.standard} · {p.city}/{p.state}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span><strong className="text-gray-700 dark:text-gray-300">{Number(p.eligibleAreaHa).toLocaleString('pt-BR')}</strong> ha elegíveis</span>
                      <span><strong className="text-gray-700 dark:text-gray-300">{Number(p.projectedReduction).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong> tCO₂e/ano</span>
                      {p.estimatedCreditPrice && (
                        <span><strong className="text-gray-700 dark:text-gray-300">R$ {Number(p.estimatedCreditPrice).toFixed(2)}</strong>/crédito</span>
                      )}
                      {p._count.credits > 0 && (
                        <span><strong className="text-gray-700 dark:text-gray-300">{p._count.credits}</strong> créditos</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
