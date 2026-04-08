'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlink,
  X,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import toast from 'react-hot-toast';

/* ─── Types ──────────────────────────────── */

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: string;
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
  total?: number;
  total_pages?: number;
}

interface Report {
  equity_value?: number;
  risk_score?: number;
  report_pdf_url?: string;
  percentile?: number;
  ai_analysis?: string;
  [key: string]: unknown;
}

const QV_URL = 'https://quantovale.online';

/* ─── Component ──────────────────────────── */

export default function ValuationPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // detail modal
  const [selected, setSelected] = useState<Valuation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'report'>('info');

  // create iframe modal
  const [createOpen, setCreateOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  /* ── Fetch ── */

  const fetchValuations = useCallback(async (pg = 1) => {
    setLoadingValuations(true);
    try {
      const { data } = await api.get<{ data: Valuation[]; pagination: Pagination }>(
        `/quantovale/valuations?page=${pg}`,
      );
      setValuations(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch { toast.error('Erro ao buscar valuations.'); }
    finally { setLoadingValuations(false); }
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const { data } = await api.get<ConnectionStatus>('/quantovale/status');
      setStatus(data);
      if (data.connected) fetchValuations(1);
    } catch { toast.error('Erro ao verificar conexão.'); }
    finally { setLoadingStatus(false); }
  }, [fetchValuations]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // B: poll every 15 s while any valuation is still processing / pending
  useEffect(() => {
    const needsPoll = valuations.some((v) => v.status === 'processing' || v.status === 'pending');
    if (!needsPoll) return;
    const id = setInterval(() => fetchValuations(page), 15_000);
    return () => clearInterval(id);
  }, [valuations, page, fetchValuations]);

  /* ── Actions ── */

  async function handleConnect() {
    try {
      const { data } = await api.get<{ url: string }>('/quantovale/connect');
      window.location.href = data.url;
    } catch { toast.error('Não foi possível iniciar a conexão.'); }
  }

  async function handleDisconnect() {
    if (!confirm('Deseja desconectar sua conta QuantoVale?')) return;
    setDisconnecting(true);
    try {
      await api.delete('/quantovale/disconnect');
      toast.success('Conta desconectada.');
      setStatus({ connected: false });
      setValuations([]);
    } catch { toast.error('Erro ao desconectar.'); }
    finally { setDisconnecting(false); }
  }

  async function handleViewDetail(v: Valuation) {
    setSelected(v);
    setDetailTab('info');
    setReport(null);
    setLoadingDetail(true);
    try {
      const { data } = await api.get<Valuation>(`/quantovale/valuations/${v.id}`);
      setSelected(data);
    } catch { /* keep what we have */ }
    setLoadingDetail(false);
  }

  async function handleLoadReport(id: string) {
    setDetailTab('report');
    setLoadingDetail(true);
    try {
      const { data } = await api.get<Report>(`/quantovale/valuations/${id}/report`);
      setReport(data);
    } catch { toast.error('Relatório não disponível ainda.'); }
    finally { setLoadingDetail(false); }
  }

  function openCreate() {
    setIframeLoading(true);
    setIframeKey((k) => k + 1);
    setCreateOpen(true);
  }

  // A+F: close create modal and silently refresh the list
  function closeCreate() {
    setCreateOpen(false);
    fetchValuations(page);
  }

  /* ── Helpers ── */

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
        {labels[s ?? ''] ?? s ?? '—'}
      </span>
    );
  }

  function equityValue(v: Valuation): number | null {
    if (v.equity_value != null) return v.equity_value;
    if (typeof v.valuation_result === 'number') return v.valuation_result;
    if (v.valuation_result && typeof v.valuation_result === 'object' && 'equity_value' in v.valuation_result)
      return v.valuation_result.equity_value as number;
    return null;
  }

  const filtered = valuations.filter((v) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return v.company_name?.toLowerCase().includes(t) || v.sector?.toLowerCase().includes(t) ||
      v.status?.toLowerCase().includes(t) || v.plan?.toLowerCase().includes(t);
  });

  const totalEquity = valuations.reduce((s, v) => s + (equityValue(v) ?? 0), 0);
  const completed = valuations.filter((v) => v.status === 'completed').length;

  /* ── Loading ── */

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── Not connected ── */
  if (!status?.connected) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center space-y-5 max-w-md w-full">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
            <Zap className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Conecte sua conta QuantoVale</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Autorize o ConectCampo a acessar sua conta QuantoVale para visualizar e gerenciar seus valuations aqui.
            </p>
          </div>
          <button onClick={handleConnect} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm">
            <Zap className="h-4 w-4" /> Conectar ao QuantoVale
          </button>
          <a href={QV_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition">
            Conhecer o QuantoVale <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  /* ── Token expired ── */
  if (status.tokenExpired) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-10 text-center space-y-4 max-w-md w-full">
          <p className="text-3xl">⚠️</p>
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Sessão expirada</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">Reconecte para continuar acessando seus valuations.</p>
          <button onClick={handleConnect} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition">
            <Zap className="h-4 w-4" /> Reconectar
          </button>
        </div>
      </div>
    );
  }

  /* ── Connected ── */
  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-emerald-500" />
              Valuations — QuantoVale
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Conectado
              {status.connectedAt && (
                <span className="hidden sm:inline">
                  desde {new Date(status.connectedAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchValuations(page)}
              disabled={loadingValuations}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingValuations ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <a
              href={QV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ExternalLink className="h-4 w-4" /> QuantoVale.online
            </a>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" /> Desconectar
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total de Valuations', value: String(valuations.length), icon: FileText, color: 'blue' },
            { label: 'Concluídos', value: String(completed), icon: ShieldCheck, color: 'emerald' },
            { label: 'Valor Total (Equity)', value: totalEquity > 0 ? formatCurrency(totalEquity) : '—', icon: DollarSign, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg bg-${color}-50 dark:bg-${color}-950/50 p-2`}>
                  <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + create */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por empresa, setor, plano..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> Criar Valuation
          </button>
        </div>

        {/* List */}
        {loadingValuations ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="shrink-0">
                    <div className="h-6 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum valuation ainda'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Tente outro termo.' : 'Crie seu primeiro valuation no QuantoVale.'}
            </p>
            {!searchTerm && (
              <button onClick={openCreate} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                <Plus className="h-4 w-4" /> Criar valuation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => {
              const ev = equityValue(v);
              return (
                <div
                  key={v.id}
                  onClick={() => handleViewDetail(v)}
                  className="group cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 font-bold text-sm shrink-0">
                      {(v.company_name ?? 'V')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{v.company_name ?? '—'}</p>
                        {statusBadge(v.status)}
                        {v.plan && <span className="text-xs text-gray-400 capitalize">{v.plan}</span>}
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
                    <div className="text-right shrink-0">
                      {ev != null
                        ? <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(ev)}</p>
                        : <p className="text-sm text-gray-400">—</p>}
                      {v.payment_url && v.status === 'draft' && (
                        <a href={v.payment_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mt-1">
                          Pagar <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition shrink-0" />
                  </div>
                </div>
              );
            })}
            {(pagination?.total_pages ?? 1) > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">
                  {pagination?.total ? `${pagination.total} valuations no total` : ''}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => { const p = page - 1; setPage(p); fetchValuations(p); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                  </button>
                  <span className="text-xs text-gray-500 tabular-nums">
                    {page} / {pagination?.total_pages}
                  </span>
                  <button
                    disabled={page === (pagination?.total_pages ?? 1)}
                    onClick={() => { const p = page + 1; setPage(p); fetchValuations(p); }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Próxima <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Detail modal ═══ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{selected.company_name ?? 'Valuation'}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {statusBadge(selected.status)}
                  {selected.plan && <span className="text-xs text-gray-500 capitalize">{selected.plan}</span>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-100 dark:border-gray-800 shrink-0">
              <button onClick={() => setDetailTab('info')}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition ${detailTab === 'info' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
                Detalhes
              </button>
              <button onClick={() => handleLoadReport(selected.id)}
                className={`flex-1 py-2.5 text-sm font-medium text-center border-b-2 transition ${detailTab === 'report' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}>
                Relatório
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
                </div>
              ) : detailTab === 'info' ? (
                <div className="space-y-4">
                  {equityValue(selected) != null && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Valor de Mercado (Equity)</p>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatCurrency(equityValue(selected)!)}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Setor', value: selected.sector },
                      { label: 'CNPJ', value: selected.cnpj },
                      { label: 'Plano', value: selected.plan },
                      { label: 'Risco', value: selected.risk_score != null ? `${selected.risk_score}/10` : null },
                      { label: 'Criado em', value: selected.created_at ? new Date(selected.created_at).toLocaleDateString('pt-BR') : null },
                      { label: 'Atualizado em', value: selected.updated_at ? new Date(selected.updated_at).toLocaleDateString('pt-BR') : null },
                    ].filter((i) => i.value).map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                  {selected.ai_analysis && (
                    <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Análise IA</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.ai_analysis}</p>
                    </div>
                  )}
                  {selected.payment_url && selected.status === 'draft' && (
                    <a href={selected.payment_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition">
                      <DollarSign className="h-4 w-4" /> Realizar Pagamento <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!report ? (
                    <p className="text-sm text-center text-gray-500 py-8">Relatório não disponível para este valuation.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {report.equity_value != null && (
                          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Equity Value</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(report.equity_value)}</p>
                          </div>
                        )}
                        {report.risk_score != null && (
                          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">Risco</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{report.risk_score}/10</p>
                          </div>
                        )}
                        {report.percentile != null && (
                          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">Percentil</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">Top {report.percentile}%</p>
                          </div>
                        )}
                      </div>
                      {report.ai_analysis && (
                        <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">Análise IA</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.ai_analysis}</p>
                        </div>
                      )}
                      {report.report_pdf_url && (
                        <a href={report.report_pdf_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition">
                          <Download className="h-4 w-4" /> Baixar PDF <ExternalLink className="h-3.5 w-3.5" />
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

      {/* ═══ Create iframe modal ═══ */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={closeCreate}>
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Criar Valuation — QuantoVale</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIframeLoading(true); setIframeKey((k) => k + 1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${iframeLoading ? 'animate-spin' : ''}`} /> Recarregar
              </button>
              <a
                href={QV_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Abrir em nova aba
              </a>
              <button
                onClick={closeCreate}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-900 z-10">
                <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Carregando QuantoVale...</p>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={QV_URL}
              title="Criar Valuation — QuantoVale"
              className="w-full h-full border-0"
              onLoad={() => setIframeLoading(false)}
              allow="clipboard-write; clipboard-read"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>
        </div>
      )}
    </>
  );
}
