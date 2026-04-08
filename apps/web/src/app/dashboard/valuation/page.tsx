'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Calculator,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Info,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Unlink,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

/* ─── Types ──────────────────────────────────────────────────── */

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: string;
  scopes?: string[];
  tokenExpired?: boolean;
}

interface Valuation {
  id: string;
  company_name?: string;
  status?: string;
  plan?: string;
  valuation_result?: number | Record<string, unknown>;
  equity_value?: number;
  payment_url?: string;
  created_at?: string;
  updated_at?: string;
  sector?: string;
  cnpj?: string;
  risk_score?: number;
  maturity_index?: number;
  ai_analysis?: string;
  [key: string]: unknown;
}

interface Pagination {
  page?: number;
  total?: number;
  total_pages?: number;
  page_size?: number;
}

interface Report {
  equity_value?: number;
  risk_score?: number;
  report_pdf_url?: string;
  maturity_index?: number;
  percentile?: number;
  ai_analysis?: string;
  [key: string]: unknown;
}

interface Plan {
  id?: string;
  name?: string;
  slug?: string;
  price?: number;
  description?: string;
  features?: string[];
  [key: string]: unknown;
}

interface SimulateResult {
  equity_value_min?: number;
  equity_value_max?: number;
  equity_value?: number;
  [key: string]: unknown;
}

/* ─── Component ──────────────────────────────────────────────── */

export default function ValuationPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'simulate' | 'plans'>('list');
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null);
  const [reportData, setReportData] = useState<Report | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'report'>('info');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [simForm, setSimForm] = useState({
    company_name: '', sector: '', revenue: '', net_margin: '',
    growth_rate: '', debt: '', cash: '',
  });
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [createForm, setCreateForm] = useState({
    company_name: '', plan: 'essencial', annual_revenue: '',
    annual_costs: '', annual_expenses: '', sector: '', growth_rate: '',
  });
  const [creating, setCreating] = useState(false);

  /* ── Data fetching ─────────────────────────────────────── */

  useEffect(() => { fetchStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const { data } = await api.get<ConnectionStatus>('/quantovale/status');
      setStatus(data);
      if (data.connected) fetchValuations();
    } catch {
      toast.error('Erro ao verificar conexão.');
    } finally {
      setLoadingStatus(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchValuations() {
    setLoadingValuations(true);
    try {
      const { data } = await api.get<{ data: Valuation[]; pagination: Pagination }>('/quantovale/valuations');
      setValuations(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      toast.error('Erro ao buscar valuations.');
    } finally {
      setLoadingValuations(false);
    }
  }

  async function fetchPlans() {
    if (plans.length > 0) return;
    setLoadingPlans(true);
    try {
      const { data } = await api.get('/quantovale/plans');
      const list = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>).data ?? (data as Record<string, unknown>).plans ?? [];
      setPlans(list as Plan[]);
    } catch {
      toast.error('Erro ao buscar planos.');
    } finally {
      setLoadingPlans(false);
    }
  }

  /* ── Actions ───────────────────────────────────────────── */

  async function handleConnect() {
    try {
      const { data } = await api.get<{ url: string }>('/quantovale/connect');
      window.location.href = data.url;
    } catch {
      toast.error('Não foi possível iniciar a conexão.');
    }
  }

  async function handleDisconnect() {
    if (!confirm('Deseja desconectar sua conta QuantoVale?')) return;
    setDisconnecting(true);
    try {
      await api.delete('/quantovale/disconnect');
      toast.success('Conta QuantoVale desconectada.');
      setStatus({ connected: false });
      setValuations([]);
    } catch {
      toast.error('Erro ao desconectar.');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleViewDetail(v: Valuation) {
    setSelectedValuation(v);
    setDetailTab('info');
    setReportData(null);
    setLoadingDetail(true);
    try {
      const { data } = await api.get<Valuation>(`/quantovale/valuations/${v.id}`);
      setSelectedValuation(data);
    } catch { /* keep what we already have */ }
    setLoadingDetail(false);
  }

  async function handleLoadReport(valuationId: string) {
    setDetailTab('report');
    setLoadingDetail(true);
    try {
      const { data } = await api.get<Report>(`/quantovale/valuations/${valuationId}/report`);
      setReportData(data);
    } catch {
      toast.error('Relatório ainda não disponível.');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreateValuation(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.company_name || !createForm.plan) {
      toast.error('Preencha nome da empresa e plano.');
      return;
    }
    setCreating(true);
    try {
      const payload: Record<string, unknown> = {
        company_name: createForm.company_name,
        plan: createForm.plan,
      };
      if (createForm.annual_revenue) payload.annual_revenue = Number(createForm.annual_revenue);
      if (createForm.annual_costs) payload.annual_costs = Number(createForm.annual_costs);
      if (createForm.annual_expenses) payload.annual_expenses = Number(createForm.annual_expenses);
      if (createForm.sector) payload.sector = createForm.sector;
      if (createForm.growth_rate) payload.growth_rate = Number(createForm.growth_rate) / 100;

      const { data } = await api.post<{ data: Valuation }>('/quantovale/valuations', payload);
      toast.success('Valuation criado com sucesso!');
      if (data.data?.payment_url) window.open(data.data.payment_url, '_blank');

      setCreateForm({
        company_name: '', plan: 'essencial', annual_revenue: '',
        annual_costs: '', annual_expenses: '', sector: '', growth_rate: '',
      });
      setActiveTab('list');
      fetchValuations();
    } catch {
      toast.error('Erro ao criar valuation.');
    } finally {
      setCreating(false);
    }
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    if (!simForm.revenue || !simForm.net_margin) {
      toast.error('Preencha receita e margem líquida.');
      return;
    }
    setSimulating(true);
    setSimResult(null);
    try {
      const payload: Record<string, unknown> = {
        company_name: simForm.company_name || 'Simulação',
        sector: simForm.sector || 'Geral',
        revenue: Number(simForm.revenue),
        net_margin: Number(simForm.net_margin) / 100,
      };
      if (simForm.growth_rate) payload.growth_rate = Number(simForm.growth_rate) / 100;
      if (simForm.debt) payload.debt = Number(simForm.debt);
      if (simForm.cash) payload.cash = Number(simForm.cash);

      const { data } = await api.post<SimulateResult>('/quantovale/simulate', payload);
      setSimResult(data);
      toast.success('Simulação concluída!');
    } catch {
      toast.error('Erro na simulação.');
    } finally {
      setSimulating(false);
    }
  }

  /* ── Helpers ───────────────────────────────────────────── */

  function statusBadge(s?: string) {
    const colors: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    };
    const labels: Record<string, string> = {
      completed: 'Concluído', draft: 'Rascunho', pending: 'Pendente',
      processing: 'Processando', failed: 'Falhou',
    };
    const cls = colors[s ?? ''] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
        {labels[s ?? ''] ?? s ?? '\u2014'}
      </span>
    );
  }

  function equityValue(v: Valuation): number | null {
    if (v.equity_value != null) return v.equity_value;
    if (typeof v.valuation_result === 'number') return v.valuation_result;
    if (v.valuation_result && typeof v.valuation_result === 'object' && 'equity_value' in v.valuation_result) {
      return v.valuation_result.equity_value as number;
    }
    return null;
  }

  /* ── Derived ───────────────────────────────────────────── */

  const filteredValuations = valuations.filter((v) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      v.company_name?.toLowerCase().includes(t) ||
      v.sector?.toLowerCase().includes(t) ||
      v.status?.toLowerCase().includes(t) ||
      v.plan?.toLowerCase().includes(t)
    );
  });

  const totalValuations = valuations.length;
  const completedValuations = valuations.filter((v) => v.status === 'completed').length;
  const totalEquity = valuations.reduce((sum, v) => sum + (equityValue(v) ?? 0), 0);

  /* ── Render ────────────────────────────────────────────── */

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Valuations &mdash; QuantoVale
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Valuation empresarial integrado ao QuantoVale
          </p>
        </div>
        {status?.connected && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('list'); fetchValuations(); }}
              disabled={loadingValuations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingValuations ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" /> Desconectar
            </button>
          </div>
        )}
      </div>

      {/* ── Not connected ── */}
      {!status?.connected && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
            <Zap className="h-7 w-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conecte sua conta QuantoVale
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Integre o QuantoVale ao ConectCampo para criar valuations, acessar relatórios
            completos, simular o valor da sua empresa e acompanhar tudo em tempo real.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              <Zap className="h-4 w-4" /> Conectar ao QuantoVale
            </button>
            <a
              href="https://quantovale.online"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Conhecer o QuantoVale <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* ── Token expired ── */}
      {status?.connected && status.tokenExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
          <span className="text-amber-600 text-lg">{'\u26A0\uFE0F'}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Sessão expirada</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Seu token do QuantoVale expirou. Reconecte para continuar.
            </p>
          </div>
          <button onClick={handleConnect} className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline">
            Reconectar
          </button>
        </div>
      )}

      {/* ── Connected content ── */}
      {status?.connected && !status.tokenExpired && (
        <>
          {/* Connection badge */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">QuantoVale conectado</p>
            {status.connectedAt && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto hidden sm:inline">
                Desde {new Date(status.connectedAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-2">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalValuations}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total de Valuations</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedValuations}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Concluídos</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/50 p-2">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalEquity > 0 ? formatCurrency(totalEquity) : '\u2014'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total (Equity)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {([
              { key: 'list' as const, label: 'Meus Valuations', icon: FileText },
              { key: 'create' as const, label: 'Criar Valuation', icon: Plus },
              { key: 'simulate' as const, label: 'Simulação Gratuita', icon: Calculator },
              { key: 'plans' as const, label: 'Planos', icon: DollarSign },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); if (key === 'plans') fetchPlans(); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ───────── Tab: LIST ───────── */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por empresa, setor, status..."
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  <Plus className="h-4 w-4" /> Novo Valuation
                </button>
              </div>

              {loadingValuations ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : filteredValuations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center space-y-3">
                  <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum valuation ainda'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? 'Tente outro termo de busca.'
                      : 'Crie seu primeiro valuation ou faça uma simulação gratuita.'}
                  </p>
                  {!searchTerm && (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setActiveTab('create')}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <Plus className="h-4 w-4" /> Criar valuation
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <button
                        onClick={() => setActiveTab('simulate')}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Calculator className="h-4 w-4" /> Simular grátis
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredValuations.map((v) => {
                    const ev = equityValue(v);
                    return (
                      <div
                        key={v.id}
                        onClick={() => handleViewDetail(v)}
                        className="group cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {(v.company_name ?? 'V')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {v.company_name ?? '\u2014'}
                              </p>
                              {statusBadge(v.status)}
                              {v.plan && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{v.plan}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {v.sector && <span>{v.sector}</span>}
                              {v.created_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(v.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {ev != null ? (
                              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(ev)}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500">{'\u2014'}</p>
                            )}
                            {v.payment_url && v.status === 'draft' && (
                              <a
                                href={v.payment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mt-1"
                              >
                                Pagar <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition" />
                        </div>
                      </div>
                    );
                  })}
                  {pagination && pagination.total_pages && pagination.total_pages > 1 && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                      Mostrando {filteredValuations.length} de {pagination.total} valuations
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ───────── Tab: CREATE ───────── */}
          {activeTab === 'create' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-2">
                  <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Valuation</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Preencha os dados da empresa para criar um valuation profissional
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateValuation} className="space-y-5 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome da Empresa *
                    </label>
                    <input
                      required
                      value={createForm.company_name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, company_name: e.target.value }))}
                      placeholder="Empresa Exemplo Ltda"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Plano *</label>
                    <select
                      required
                      value={createForm.plan}
                      onChange={(e) => setCreateForm((f) => ({ ...f, plan: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="essencial">Essencial</option>
                      <option value="profissional">Profissional</option>
                      <option value="estrategico">Estratégico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                    <input
                      value={createForm.sector}
                      onChange={(e) => setCreateForm((f) => ({ ...f, sector: e.target.value }))}
                      placeholder="Agronegócio"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" /> Dados Financeiros
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { key: 'annual_revenue', label: 'Receita Anual (R$)', req: true },
                      { key: 'annual_costs', label: 'Custos Anuais (R$)', req: true },
                      { key: 'annual_expenses', label: 'Despesas Anuais (R$)', req: true },
                      { key: 'growth_rate', label: 'Crescimento (%)', req: false },
                    ].map(({ key, label, req }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {label}
                          {req && ' *'}
                        </label>
                        <input
                          type="number"
                          required={req}
                          value={createForm[key as keyof typeof createForm]}
                          onChange={(e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder="0"
                          min="0"
                          step="any"
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                  >
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {creating ? 'Criando...' : 'Criar Valuation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('simulate')}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                  >
                    Ou simule gratuitamente &rarr;
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ───────── Tab: SIMULATE ───────── */}
          {activeTab === 'simulate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-2">
                    <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Simulação Gratuita</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Descubra uma estimativa de valor da empresa
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Empresa
                      </label>
                      <input
                        value={simForm.company_name}
                        onChange={(e) => setSimForm((f) => ({ ...f, company_name: e.target.value }))}
                        placeholder="Opcional"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Receita Anual (R$) *
                      </label>
                      <input
                        type="number"
                        required
                        value={simForm.revenue}
                        onChange={(e) => setSimForm((f) => ({ ...f, revenue: e.target.value }))}
                        placeholder="5000000"
                        min="0"
                        step="any"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Margem Líquida (%) *
                      </label>
                      <input
                        type="number"
                        required
                        value={simForm.net_margin}
                        onChange={(e) => setSimForm((f) => ({ ...f, net_margin: e.target.value }))}
                        placeholder="15"
                        step="any"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                      <input
                        value={simForm.sector}
                        onChange={(e) => setSimForm((f) => ({ ...f, sector: e.target.value }))}
                        placeholder="Tecnologia"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Crescimento (%)
                      </label>
                      <input
                        type="number"
                        value={simForm.growth_rate}
                        onChange={(e) => setSimForm((f) => ({ ...f, growth_rate: e.target.value }))}
                        placeholder="20"
                        step="any"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dívida (R$)
                      </label>
                      <input
                        type="number"
                        value={simForm.debt}
                        onChange={(e) => setSimForm((f) => ({ ...f, debt: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Caixa (R$)
                      </label>
                      <input
                        type="number"
                        value={simForm.cash}
                        onChange={(e) => setSimForm((f) => ({ ...f, cash: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={simulating}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {simulating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                    {simulating ? 'Simulando...' : 'Simular Valuation'}
                  </button>
                </form>
              </div>

              {/* Result */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
                {simResult ? (
                  <div className="space-y-6 w-full">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Estimativa de Valuation
                      </p>
                      {simResult.equity_value != null ? (
                        <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(simResult.equity_value)}
                        </p>
                      ) : simResult.equity_value_min != null && simResult.equity_value_max != null ? (
                        <div>
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(simResult.equity_value_min)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 my-1">a</p>
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(simResult.equity_value_max)}
                          </p>
                        </div>
                      ) : (
                        <pre className="text-sm text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-auto max-h-60">
                          {JSON.stringify(simResult, null, 2)}
                        </pre>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-center text-xs text-gray-500 dark:text-gray-400">
                      <Info className="h-3.5 w-3.5" />
                      <span>Resultado indicativo. Para um relatório completo, crie um valuation.</span>
                    </div>
                    <button
                      onClick={() => {
                        setCreateForm((f) => ({
                          ...f,
                          company_name: simForm.company_name || f.company_name,
                          sector: simForm.sector || f.sector,
                          annual_revenue: simForm.revenue || f.annual_revenue,
                        }));
                        setActiveTab('create');
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      <Plus className="h-4 w-4" /> Criar Valuation Completo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-blue-300 dark:text-blue-700" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Preencha os dados e clique em &ldquo;Simular&rdquo;
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
                      A simulação usa o motor DCF do QuantoVale para estimar o valor da empresa com
                      base nos dados financeiros informados.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────── Tab: PLANS ───────── */}
          {activeTab === 'plans' && (
            <div>
              {loadingPlans ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhum plano disponível no momento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((plan, idx) => (
                    <div
                      key={plan.id ?? idx}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 flex flex-col"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {plan.name ?? plan.slug ?? `Plano ${idx + 1}`}
                      </h3>
                      {plan.price != null && (
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                          {formatCurrency(plan.price)}
                        </p>
                      )}
                      {plan.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{plan.description}</p>
                      )}
                      {plan.features && plan.features.length > 0 && (
                        <ul className="mt-4 space-y-2 flex-1">
                          {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => {
                          setCreateForm((f) => ({
                            ...f,
                            plan: plan.slug ?? plan.name ?? 'profissional',
                          }));
                          setActiveTab('create');
                        }}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                      >
                        <Plus className="h-4 w-4" /> Criar com este plano
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ───────── Detail Modal ───────── */}
      {selectedValuation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedValuation(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {selectedValuation.company_name ?? 'Valuation'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {statusBadge(selectedValuation.status)}
                  {selectedValuation.plan && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {selectedValuation.plan}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedValuation(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
              <button
                onClick={() => setDetailTab('info')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition ${
                  detailTab === 'info'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                Detalhes
              </button>
              <button
                onClick={() => handleLoadReport(selectedValuation.id)}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition ${
                  detailTab === 'report'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                Relatório
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
                </div>
              ) : detailTab === 'info' ? (
                <div className="space-y-4">
                  {equityValue(selectedValuation) != null && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Valor de Mercado (Equity)
                      </p>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatCurrency(equityValue(selectedValuation)!)}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Setor', value: selectedValuation.sector },
                      { label: 'CNPJ', value: selectedValuation.cnpj },
                      { label: 'Plano', value: selectedValuation.plan },
                      { label: 'Status', value: selectedValuation.status },
                      {
                        label: 'Criado em',
                        value: selectedValuation.created_at
                          ? new Date(selectedValuation.created_at).toLocaleDateString('pt-BR')
                          : null,
                      },
                      {
                        label: 'Atualizado em',
                        value: selectedValuation.updated_at
                          ? new Date(selectedValuation.updated_at).toLocaleDateString('pt-BR')
                          : null,
                      },
                      {
                        label: 'Risco',
                        value:
                          selectedValuation.risk_score != null
                            ? `${selectedValuation.risk_score}/10`
                            : null,
                      },
                      {
                        label: 'Maturidade',
                        value:
                          selectedValuation.maturity_index != null
                            ? `${(selectedValuation.maturity_index * 100).toFixed(0)}%`
                            : null,
                      },
                    ]
                      .filter((item) => item.value)
                      .map(({ label, value }) => (
                        <div key={label} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                            {String(value)}
                          </p>
                        </div>
                      ))}
                  </div>

                  {selectedValuation.ai_analysis && (
                    <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> Análise IA
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedValuation.ai_analysis}
                      </p>
                    </div>
                  )}

                  {selectedValuation.payment_url && selectedValuation.status === 'draft' && (
                    <a
                      href={selectedValuation.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <DollarSign className="h-4 w-4" /> Realizar Pagamento{' '}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!reportData ? (
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-8">
                      Relatório não disponível para este valuation.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {reportData.equity_value != null && (
                          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Equity Value</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(reportData.equity_value)}
                            </p>
                          </div>
                        )}
                        {reportData.risk_score != null && (
                          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risco</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              {reportData.risk_score}/10
                            </p>
                          </div>
                        )}
                        {reportData.percentile != null && (
                          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Percentil</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                              Top {reportData.percentile}%
                            </p>
                          </div>
                        )}
                      </div>

                      {reportData.ai_analysis && (
                        <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" /> Análise IA
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {reportData.ai_analysis}
                          </p>
                        </div>
                      )}

                      {reportData.report_pdf_url && (
                        <a
                          href={reportData.report_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                        >
                          <Download className="h-4 w-4" /> Baixar PDF do Relatório{' '}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
