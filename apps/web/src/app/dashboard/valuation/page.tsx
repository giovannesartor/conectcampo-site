'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Unlink,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  valuation_result?: number;
  equity_value?: number;
  payment_url?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface Pagination {
  page?: number;
  total?: number;
  has_next?: boolean;
}

interface Report {
  equity_value?: number;
  risk_score?: number;
  report_pdf_url?: string;
  [key: string]: unknown;
}

const QUANTOVALE_CLIENT_ID = 'qv_i_RZwT0M3Y7xCAcMPuMTHHjjHKfPjNTyRAtNpsSby5I';

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ValuationPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'embed'>('list');
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [reportModal, setReportModal] = useState<{ valuation: Valuation; report: Report } | null>(null);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    company_name: '',
    plan: 'profissional',
    annual_revenue: '',
    annual_costs: '',
    annual_expenses: '',
    sector: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const { data } = await api.get<ConnectionStatus>('/quantovale/status');
      setStatus(data);
      if (data.connected) fetchValuations();
    } catch {
      toast.error('Erro ao verificar conexão com o QuantoVale.');
    } finally {
      setLoadingStatus(false);
    }
  }

  async function fetchValuations() {
    setLoadingValuations(true);
    try {
      const { data } = await api.get<{ data: Valuation[]; pagination: Pagination }>('/quantovale/valuations');
      setValuations(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      toast.error('Erro ao buscar valuations. Tente reconectar.');
    } finally {
      setLoadingValuations(false);
    }
  }

  async function handleConnect() {
    try {
      const { data } = await api.get<{ url: string }>('/quantovale/connect');
      window.location.href = data.url;
    } catch {
      toast.error('Não foi possível iniciar a conexão. Tente novamente.');
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

  async function handleViewReport(valuation: Valuation) {
    setLoadingReport(valuation.id);
    try {
      const { data } = await api.get<Report>(`/quantovale/valuations/${valuation.id}/report`);
      setReportModal({ valuation, report: data });
    } catch {
      toast.error('Relatório não disponível para este valuation.');
    } finally {
      setLoadingReport(null);
    }
  }

  async function handleCreateValuation(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        company_name: createForm.company_name,
        plan: createForm.plan,
        ...(createForm.annual_revenue ? { annual_revenue: Number(createForm.annual_revenue) } : {}),
        ...(createForm.annual_costs ? { annual_costs: Number(createForm.annual_costs) } : {}),
        ...(createForm.annual_expenses ? { annual_expenses: Number(createForm.annual_expenses) } : {}),
        ...(createForm.sector ? { sector: createForm.sector } : {}),
      };
      const { data } = await api.post<{ data: Valuation }>('/quantovale/valuations', payload);
      toast.success('Valuation criado com sucesso!');
      if (data.data?.payment_url) {
        window.open(data.data.payment_url, '_blank');
      }
      setCreateForm({ company_name: '', plan: 'profissional', annual_revenue: '', annual_costs: '', annual_expenses: '', sector: '' });
      setActiveTab('list');
      fetchValuations();
    } catch {
      toast.error('Erro ao criar valuation. Verifique os dados e tente novamente.');
    } finally {
      setCreating(false);
    }
  }

  function statusBadge(s?: string) {
    const map: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };
    const label: Record<string, string> = {
      completed: 'Concluído', pending: 'Pendente', processing: 'Processando', failed: 'Falhou',
    };
    const cls = map[s ?? ''] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {label[s ?? ''] ?? s ?? '—'}
      </span>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Valuations — QuantoVale
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-dark-border px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingValuations ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" />
              Desconectar
            </button>
          </div>
        )}
      </div>

      {/* Não conectado */}
      {!status?.connected && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
            <Zap className="h-7 w-7 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conecte sua conta QuantoVale
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Integre o QuantoVale ao ConectCampo para visualizar, criar e gerenciar valuations
            empresariais diretamente aqui.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Zap className="h-4 w-4" />
            Conectar ao QuantoVale
          </button>
        </div>
      )}

      {/* Token expirado */}
      {status?.connected && status.tokenExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-4">
          <span className="text-amber-600 text-lg">⚠️</span>
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

      {/* Conectado */}
      {status?.connected && !status.tokenExpired && (
        <>
          {/* Status bar */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">QuantoVale conectado</p>
            {status.connectedAt && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-auto">
                Desde {new Date(status.connectedAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-dark-border">
            {([
              { key: 'list', label: 'Meus Valuations' },
              { key: 'create', label: 'Criar Valuation' },
              { key: 'embed', label: 'Interface QuantoVale' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TAB: Lista */}
          {activeTab === 'list' && (
            <div>
              {loadingValuations ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              ) : valuations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 p-10 text-center space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nenhum valuation encontrado
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Crie seu primeiro valuation na aba &ldquo;Criar Valuation&rdquo; ou na interface integrada.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Criar valuation
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {pagination?.total ? `${pagination.total} valuation(s)` : `${valuations.length} valuation(s)`}
                    </span>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Novo
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-3 text-left">Empresa</th>
                        <th className="px-5 py-3 text-left">Plano</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Valuation</th>
                        <th className="px-5 py-3 text-right">Data</th>
                        <th className="px-5 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {valuations.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                            {v.company_name ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-gray-500 dark:text-gray-400 capitalize">
                            {v.plan ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {statusBadge(v.status)}
                          </td>
                          <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                            {(v.equity_value ?? v.valuation_result)
                              ? formatCurrency((v.equity_value ?? v.valuation_result) as number)
                              : '—'}
                          </td>
                          <td className="px-5 py-4 text-right text-gray-500 dark:text-gray-400">
                            {v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {v.payment_url && (
                                <a
                                  href={v.payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  Pagar <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              <button
                                onClick={() => handleViewReport(v)}
                                disabled={loadingReport === v.id}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                              >
                                {loadingReport === v.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <FileText className="h-3 w-3" />
                                )}
                                Relatório
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Criar */}
          {activeTab === 'create' && (
            <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 p-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Novo Valuation</h2>
              <form onSubmit={handleCreateValuation} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome da empresa *
                  </label>
                  <input
                    required
                    value={createForm.company_name}
                    onChange={e => setCreateForm(f => ({ ...f, company_name: e.target.value }))}
                    placeholder="Empresa Exemplo Ltda"
                    className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plano *
                  </label>
                  <select
                    required
                    value={createForm.plan}
                    onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="basico">Básico</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Setor
                  </label>
                  <input
                    value={createForm.sector}
                    onChange={e => setCreateForm(f => ({ ...f, sector: e.target.value }))}
                    placeholder="Agronegócio"
                    className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'annual_revenue', label: 'Receita Anual (R$)' },
                    { key: 'annual_costs', label: 'Custos Anuais (R$)' },
                    { key: 'annual_expenses', label: 'Despesas Anuais (R$)' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                      <input
                        type="number"
                        value={createForm[key as keyof typeof createForm]}
                        onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className="w-full rounded-lg border border-gray-200 dark:border-dark-border bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                  >
                    {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {creating ? 'Criando...' : 'Criar Valuation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('embed')}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                  >
                    Ou use a interface completa →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: Embed QuantoVale */}
          {activeTab === 'embed' && (
            <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Interface QuantoVale integrada
                </span>
                <a
                  href="https://quantovale.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Abrir QuantoVale <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <iframe
                src={`https://quantovale.online/embed/valuation?client_id=${QUANTOVALE_CLIENT_ID}&theme=light&primary_color=059669`}
                width="100%"
                height="900"
                frameBorder="0"
                style={{ display: 'block', borderRadius: '0 0 16px 16px' }}
                title="QuantoVale"
              />
            </div>
          )}
        </>
      )}

      {/* Modal de Relatório */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Relatório de Valuation</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {reportModal.valuation.company_name}
                </p>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor de Mercado</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {reportModal.report.equity_value
                      ? formatCurrency(reportModal.report.equity_value)
                      : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score de Risco</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {reportModal.report.risk_score != null
                      ? `${reportModal.report.risk_score}/10`
                      : '—'}
                  </p>
                </div>
              </div>
              {reportModal.report.report_pdf_url && (
                <a
                  href={reportModal.report.report_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                >
                  <FileText className="h-4 w-4" />
                  Baixar PDF do Relatório
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {!reportModal.report.equity_value && !reportModal.report.risk_score && !reportModal.report.report_pdf_url && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Relatório ainda não disponível para este valuation.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
