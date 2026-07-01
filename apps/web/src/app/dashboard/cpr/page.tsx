'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ScrollText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Landmark,
  TrendingUp,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
  PenLine,
  Copy,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CprSummary {
  total: number;
  emitidas: number;
  registradas: number;
  liquidadas: number;
  emissoes: number;
  captacoes: number;
  totalValor: number;
  totalCaptacao: number;
  totalFeeConectCampo: number;
}

interface CprItem {
  id: string;
  numeroCpr: string | null;
  purpose: 'EMISSAO' | 'CAPTACAO';
  type: 'FISICA' | 'FINANCEIRA';
  status: string;
  produto: string;
  quantidade: number;
  unidade: string;
  valorTotal: number | null;
  dataVencimento: string;
  emitenteNome: string;
  credorNome: string;
  safraAno: string | null;
  pdfUrl: string | null;
  conectcampoFeeValue: number | null;
  signatureStatus: string | null;
  createdAt: string;
}

interface SignatureParty {
  nome: string;
  signedAt: string | null;
  token: string | null;
  signUrl?: string | null;
}

interface SignatureInfo {
  provider?: string;
  signatureStatus: string;
  documentHash: string | null;
  signedFileUrl?: string | null;
  emitente: SignatureParty;
  credor: SignatureParty;
}

interface CreateCprForm {
  purpose: 'EMISSAO' | 'CAPTACAO';
  type: 'FISICA' | 'FINANCEIRA';
  emitenteNome: string;
  emitenteCpfCnpj: string;
  emitenteCidade: string;
  emitenteEstado: string;
  emitenteCarNumero: string;
  emitenteEmail: string;
  emitenteTelefone: string;
  credorNome: string;
  credorCpfCnpj: string;
  credorTipo: string;
  credorEmail: string;
  credorTelefone: string;
  produto: string;
  quantidade: string;
  unidade: string;
  precoUnitario: string;
  localEntrega: string;
  dataEntrega: string;
  dataVencimento: string;
  prazoAnos: string;
  carenciaAnos: string;
  safras: string[];
  garantiaTipo: string;
  garantiaDescricao: string;
  garantiaValor: string;
  finalidade: string;
  valorCaptacao: string;
  observacoes: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO:   { label: 'Rascunho',    color: 'text-gray-500 bg-gray-100 dark:bg-gray-800',            icon: <Clock className="h-3 w-3" /> },
  EMITIDA:    { label: 'Emitida',     color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',          icon: <CheckCircle2 className="h-3 w-3" /> },
  REGISTRADA: { label: 'Registrada',  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', icon: <CheckCircle2 className="h-3 w-3" /> },
  LIQUIDADA:  { label: 'Liquidada',   color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',          icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELADA:  { label: 'Cancelada',   color: 'text-red-600 bg-red-50 dark:bg-red-950/30',             icon: <AlertCircle className="h-3 w-3" /> },
  VENCIDA:    { label: 'Vencida',     color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',    icon: <AlertCircle className="h-3 w-3" /> },
};

const PURPOSE_CONFIG = {
  EMISSAO:  { label: 'Emissão de CPR',   color: 'text-violet-700 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800' },
  CAPTACAO: { label: 'Captação de Crédito', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' },
};

const EMPTY_FORM: CreateCprForm = {
  purpose: 'EMISSAO',
  type: 'FINANCEIRA',
  emitenteNome: '', emitenteCpfCnpj: '', emitenteCidade: '', emitenteEstado: '', emitenteCarNumero: '',
  emitenteEmail: '', emitenteTelefone: '',
  credorNome: '', credorCpfCnpj: '', credorTipo: '', credorEmail: '', credorTelefone: '',
  produto: '', quantidade: '', unidade: 'sacas', precoUnitario: '',
  localEntrega: '', dataEntrega: '',
  dataVencimento: '', prazoAnos: '', carenciaAnos: '', safras: [],
  garantiaTipo: '', garantiaDescricao: '', garantiaValor: '',
  finalidade: '', valorCaptacao: '',
  observacoes: '',
};

// ─── Máscaras ─────────────────────────────────────────────────────────────────

function maskCpfCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CprPage() {
  const [summary, setSummary] = useState<CprSummary | null>(null);
  const [cprs, setCprs] = useState<CprItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCprForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signModal, setSignModal] = useState<{ cpr: CprItem; info: SignatureInfo } | null>(null);
  const [copied, setCopied] = useState<string>('');
  // Preços vêm da fonte única (/pricing); defaults como fallback
  const [pricing, setPricing] = useState({ fisicaFlat: 2500, financeiraRatePct: 3, captacaoFeeRatePct: 6 });

  useEffect(() => {
    api.get('/pricing').then(r => { if (r.data?.cpr) setPricing(r.data.cpr); }).catch(() => {});
  }, []);

  const load = async () => {
    try {
      const [sum, list] = await Promise.all([
        api.get('/cpr/summary').then(r => r.data),
        api.get('/cpr?perPage=50').then(r => r.data.data),
      ]);
      setSummary(sum);
      setCprs(list);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        purpose: form.purpose,
        type: form.type,
        emitenteNome: form.emitenteNome,
        emitenteCpfCnpj: form.emitenteCpfCnpj,
        emitenteEndereco: undefined,
        emitenteCidade: form.emitenteCidade || undefined,
        emitenteEstado: form.emitenteEstado || undefined,
        emitenteCarNumero: form.emitenteCarNumero || undefined,
        emitenteEmail: form.emitenteEmail || undefined,
        emitenteTelefone: form.emitenteTelefone || undefined,
        credorNome: form.credorNome,
        credorCpfCnpj: form.credorCpfCnpj,
        credorTipo: form.credorTipo || undefined,
        credorEmail: form.credorEmail || undefined,
        credorTelefone: form.credorTelefone || undefined,
        produto: form.produto,
        quantidade: parseFloat(form.quantidade),
        unidade: form.unidade,
        safraAno: form.safras.length ? form.safras.join(', ') : undefined,
        precoUnitario: form.precoUnitario ? parseFloat(form.precoUnitario) : undefined,
        localEntrega: form.localEntrega || undefined,
        dataEntrega: form.dataEntrega || undefined,
        dataVencimento: form.dataVencimento,
        prazoMeses: form.prazoAnos ? parseInt(form.prazoAnos) * 12 : undefined,
        carenciaMeses: form.carenciaAnos ? parseInt(form.carenciaAnos) * 12 : undefined,
        garantiaTipo: form.garantiaTipo || undefined,
        garantiaDescricao: form.garantiaDescricao || undefined,
        garantiaValor: form.garantiaValor ? parseFloat(form.garantiaValor) : undefined,
        finalidade: form.finalidade || undefined,
        valorCaptacao: form.valorCaptacao ? parseFloat(form.valorCaptacao) : undefined,
        observacoes: form.observacoes || undefined,
      };
      await api.post('/cpr', payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Erro ao criar CPR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmit = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/cpr/${id}/emit`);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancelar esta CPR?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/cpr/${id}`);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDocument = async (id: string) => {
    setActionLoading(id);
    try {
      const { data } = await api.get(`/cpr/${id}/document`);
      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(data.html);
        w.document.close();
      } else {
        toast.error('Permita pop-ups para abrir a minuta da CPR.');
      }
    } catch {
      toast.error('Não foi possível gerar a minuta agora.');
    } finally {
      setActionLoading(null);
    }
  };

  const openSignature = async (cpr: CprItem) => {
    if (cpr.status === 'RASCUNHO') {
      toast('Emita a CPR antes de solicitar assinaturas.');
      return;
    }
    setActionLoading(cpr.id);
    try {
      if (!cpr.signatureStatus || cpr.signatureStatus === 'NAO_INICIADA') {
        await api.post(`/cpr/${cpr.id}/signature/request`);
      }
      const { data } = await api.get<SignatureInfo>(`/cpr/${cpr.id}/signature`);
      setSignModal({ cpr, info: data });
      await load();
    } catch {
      toast.error('Não foi possível abrir a assinatura agora.');
    } finally {
      setActionLoading(null);
    }
  };

  const resetSignature = async (cprId: string) => {
    if (!confirm('Gerar novos links invalida as assinaturas já coletadas. Continuar?')) return;
    setActionLoading(cprId);
    try {
      await api.post(`/cpr/${cprId}/signature/request`);
      const { data } = await api.get<SignatureInfo>(`/cpr/${cprId}/signature`);
      setSignModal(prev => (prev ? { ...prev, info: data } : prev));
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const downloadSigned = async (cprId: string) => {
    try {
      const { data } = await api.get(`/cpr/${cprId}/signed-file`);
      if (data?.url) window.open(data.url, '_blank');
      else toast.error('PDF assinado ainda não disponível.');
    } catch {
      toast.error('PDF assinado ainda não disponível.');
    }
  };

  const partyUrl = (party: SignatureParty) =>
    party.signUrl ||
    (party.token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cpr/assinar/${party.token}` : '');

  const copyLink = (party: SignatureParty, who: string) => {
    const url = partyUrl(party);
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopied(who);
    setTimeout(() => setCopied(''), 1800);
  };

  const set = (k: keyof CreateCprForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  // Setter com máscara (CPF/CNPJ, telefone)
  const setMasked = (k: keyof CreateCprForm, mask: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: mask(e.target.value) }));

  // ─── Prazo / Safras / Carência ──────────────────────────────────────────────
  const prazoAnosNum = form.prazoAnos ? parseInt(form.prazoAnos) : 0;
  const carenciaMaxAnos = prazoAnosNum > 0 ? Math.min(5, prazoAnosNum) : 5;

  // Safras candidatas: ano-safra corrente + próximos 15 anos
  const SAFRA_OPTIONS = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 16 }, (_, i) => `${base + i}/${base + i + 1}`);
  }, []);

  const onPrazoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const anos = e.target.value;
    const n = anos ? parseInt(anos) : 0;
    setForm(prev => ({
      ...prev,
      prazoAnos: anos,
      // mantém no máximo `n` safras selecionadas
      safras: n > 0 ? prev.safras.slice(0, n) : prev.safras,
      // carência não pode exceder o prazo (máx. 5 anos)
      carenciaAnos:
        prev.carenciaAnos && parseInt(prev.carenciaAnos) > Math.min(5, n || 5)
          ? String(Math.min(5, n || 5))
          : prev.carenciaAnos,
    }));
  };

  const toggleSafra = (s: string) =>
    setForm(prev => {
      if (prev.safras.includes(s)) {
        return { ...prev, safras: prev.safras.filter(x => x !== s) };
      }
      if (prazoAnosNum > 0 && prev.safras.length >= prazoAnosNum) return prev; // respeita o limite do prazo
      return { ...prev, safras: [...prev.safras, s].sort() };
    });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-emerald-600" />
            Gerador de CPR
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cédula de Produto Rural — Emissão ou Captação de Crédito
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova CPR
        </button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de CPRs',      value: summary.total,       icon: <ScrollText className="h-5 w-5 text-gray-500" />,    color: 'border-gray-200' },
            { label: 'Emitidas',           value: summary.emitidas,    icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />,  color: 'border-blue-200' },
            { label: 'Emissões',           value: summary.emissoes,    icon: <FileText className="h-5 w-5 text-violet-500" />,    color: 'border-violet-200' },
            { label: 'Captações',          value: summary.captacoes,   icon: <Landmark className="h-5 w-5 text-amber-500" />,     color: 'border-amber-200' },
          ].map(k => (
            <div key={k.label} className={`bg-white dark:bg-gray-800 border ${k.color} dark:border-gray-700 rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-gray-500 dark:text-gray-400">{k.label}</span></div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {summary && (summary.totalValor > 0 || summary.totalCaptacao > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Total CPRs</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.totalValor)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volume Captação</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.totalCaptacao)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Fee ConectCampo (6%)
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.totalFeeConectCampo)}</p>
          </div>
        </div>
      )}

      {/* Lista de CPRs */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : cprs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma CPR criada ainda"
          description="Emita uma Cédula de Produto Rural ou use uma CPR para captar crédito."
          actionLabel="Nova CPR"
          onAction={() => { setShowForm(true); setError(''); }}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Número', 'Finalidade', 'Produto', 'Qtd', 'Valor Total', 'Credor', 'Vencimento', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {cprs.map(cpr => {
                  const status = STATUS_CONFIG[cpr.status] ?? { label: cpr.status, color: 'text-gray-500 bg-gray-100', icon: null };
                  const purpose = PURPOSE_CONFIG[cpr.purpose];
                  const isLoading = actionLoading === cpr.id;
                  return (
                    <tr key={cpr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {cpr.numeroCpr ?? <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${purpose.color}`}>
                          {purpose.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {cpr.produto}
                        {cpr.safraAno && <span className="text-gray-400 text-xs ml-1">({cpr.safraAno})</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {Number(cpr.quantidade).toLocaleString('pt-BR')} {cpr.unidade}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {cpr.valorTotal ? formatCurrency(Number(cpr.valorTotal)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{cpr.credorNome}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {new Date(cpr.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon}{status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDocument(cpr.id)}
                            disabled={isLoading}
                            className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-medium disabled:opacity-50 flex items-center gap-1"
                            title="Ver / imprimir minuta"
                          >
                            <FileText className="h-3.5 w-3.5" /> Documento
                          </button>
                          {cpr.status !== 'RASCUNHO' && (
                            <button
                              onClick={() => openSignature(cpr)}
                              disabled={isLoading}
                              className={`text-xs font-medium disabled:opacity-50 flex items-center gap-1 ${
                                cpr.signatureStatus === 'ASSINADA'
                                  ? 'text-teal-600 hover:text-teal-800 dark:text-teal-400'
                                  : 'text-violet-600 hover:text-violet-800 dark:text-violet-400'
                              }`}
                              title="Assinatura eletrônica"
                            >
                              <PenLine className="h-3.5 w-3.5" />
                              {cpr.signatureStatus === 'ASSINADA'
                                ? 'Assinada'
                                : cpr.signatureStatus === 'PARCIAL'
                                  ? 'Assinar (1/2)'
                                  : 'Assinar'}
                            </button>
                          )}
                          {cpr.status === 'RASCUNHO' && (
                            <button
                              onClick={() => handleEmit(cpr.id)}
                              disabled={isLoading}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                              Emitir
                            </button>
                          )}
                          {['RASCUNHO', 'EMITIDA'].includes(cpr.status) && (
                            <button
                              onClick={() => handleDelete(cpr.id)}
                              disabled={isLoading}
                              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                              title="Cancelar CPR"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Drawer de criação */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div
            className="relative h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header do drawer */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova CPR</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cédula de Produto Rural</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Finalidade */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Finalidade</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['EMISSAO', 'CAPTACAO'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, purpose: p }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.purpose === p
                          ? p === 'EMISSAO'
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                            : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {p === 'EMISSAO' ? 'Emissão de CPR' : 'Captação de Crédito'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {p === 'EMISSAO'
                          ? 'Emite uma CPR física ou financeira'
                          : 'Usa a CPR como garantia para captar crédito'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo de CPR</label>
                  <select value={form.type} onChange={set('type')} className={inputClass}>
                    <option value="FINANCEIRA">CPR Financeira (liquidação em dinheiro)</option>
                    <option value="FISICA">CPR Física (entrega do produto)</option>
                  </select>
                </div>
              </section>

              <Divider />

              {/* Emitente */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Emitente (Produtor Rural)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Field label="Nome completo *" value={form.emitenteNome} onChange={set('emitenteNome')} required /></div>
                  <Field label="CPF / CNPJ *" value={form.emitenteCpfCnpj} onChange={setMasked('emitenteCpfCnpj', maskCpfCnpj)} required placeholder="000.000.000-00" inputMode="numeric" />
                  <Field label="Número CAR" value={form.emitenteCarNumero} onChange={set('emitenteCarNumero')} placeholder="SP-XXXXXXX-XXXX..." />
                  <Field label="E-mail (p/ assinatura)" value={form.emitenteEmail} onChange={set('emitenteEmail')} type="email" placeholder="email@exemplo.com" />
                  <Field label="Telefone / WhatsApp" value={form.emitenteTelefone} onChange={setMasked('emitenteTelefone', maskPhone)} placeholder="(11) 99999-9999" inputMode="tel" />
                  <Field label="Cidade" value={form.emitenteCidade} onChange={set('emitenteCidade')} />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                    <select value={form.emitenteEstado} onChange={set('emitenteEstado')} className={inputClass}>
                      <option value="">Selecione...</option>
                      {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <Divider />

              {/* Credor */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Credor</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Field label="Nome *" value={form.credorNome} onChange={set('credorNome')} required /></div>
                  <Field label="CPF / CNPJ *" value={form.credorCpfCnpj} onChange={setMasked('credorCpfCnpj', maskCpfCnpj)} required placeholder="00.000.000/0000-00" inputMode="numeric" />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
                    <select value={form.credorTipo} onChange={set('credorTipo')} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="banco">Banco</option>
                      <option value="cooperativa">Cooperativa</option>
                      <option value="pessoa_fisica">Pessoa Física</option>
                      <option value="pessoa_juridica">Pessoa Jurídica</option>
                      <option value="fundo">Fundo de Investimento</option>
                    </select>
                  </div>
                  <Field label="E-mail (p/ assinatura)" value={form.credorEmail} onChange={set('credorEmail')} type="email" placeholder="email@exemplo.com" />
                  <Field label="Telefone / WhatsApp" value={form.credorTelefone} onChange={set('credorTelefone')} placeholder="(11) 99999-9999" />
                </div>
              </section>

              <Divider />

              {/* Produto */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Produto Agrícola</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Produto *</label>
                    <select value={form.produto} onChange={set('produto')} className={inputClass} required>
                      <option value="">Selecione...</option>
                      {['Soja','Milho','Café','Algodão','Cana-de-açúcar','Arroz','Feijão','Trigo','Boi Gordo','Frango','Suíno','Leite','Outro'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="Quantidade *" value={form.quantidade} onChange={set('quantidade')} required type="number" placeholder="0" />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Unidade *</label>
                    <select value={form.unidade} onChange={set('unidade')} className={inputClass} required>
                      {['sacas','toneladas','arrobas','litros','kg','caixas','unidades'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="Preço unitário (R$)" value={form.precoUnitario} onChange={set('precoUnitario')} type="number" placeholder="0,00" />
                  <Field label="Local de entrega" value={form.localEntrega} onChange={set('localEntrega')} />
                  {form.type === 'FISICA' && (
                    <Field label="Data de entrega" value={form.dataEntrega} onChange={set('dataEntrega')} type="date" />
                  )}
                </div>
              </section>

              <Divider />

              {/* Vencimento / Prazo / Carência / Safras */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Prazo & Safras</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data de vencimento *" value={form.dataVencimento} onChange={set('dataVencimento')} required type="date" />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Prazo (até 15 anos)</label>
                    <select value={form.prazoAnos} onChange={onPrazoChange} className={inputClass}>
                      <option value="">Selecione...</option>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(a => (
                        <option key={a} value={a}>{a} {a === 1 ? 'ano' : 'anos'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Carência (máx. {carenciaMaxAnos} {carenciaMaxAnos === 1 ? 'ano' : 'anos'})
                    </label>
                    <select value={form.carenciaAnos} onChange={set('carenciaAnos')} className={inputClass}>
                      <option value="">Sem carência</option>
                      {Array.from({ length: carenciaMaxAnos }, (_, i) => i + 1).map(a => (
                        <option key={a} value={a}>{a} {a === 1 ? 'ano' : 'anos'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Safras conforme o prazo */}
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                    Safras
                    {prazoAnosNum > 0
                      ? <span className="text-gray-400"> — selecione {prazoAnosNum} ({form.safras.length}/{prazoAnosNum})</span>
                      : <span className="text-gray-400"> — selecione o prazo primeiro</span>}
                  </label>
                  {prazoAnosNum === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Escolha o prazo acima para liberar a seleção de safras.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {SAFRA_OPTIONS.map(s => {
                        const active = form.safras.includes(s);
                        const full = !active && form.safras.length >= prazoAnosNum;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSafra(s)}
                            disabled={full}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : full
                                  ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Garantia adicional */}
              {form.purpose === 'CAPTACAO' && (
                <>
                  <Divider />
                  <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Captação de Crédito</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Finalidade</label>
                        <select value={form.finalidade} onChange={set('finalidade')} className={inputClass}>
                          <option value="">Selecione...</option>
                          <option value="custeio">Custeio Agrícola</option>
                          <option value="investimento">Investimento</option>
                          <option value="giro">Capital de Giro</option>
                          <option value="comercializacao">Comercialização</option>
                        </select>
                      </div>
                      <Field label="Valor a captar (R$)" value={form.valorCaptacao} onChange={set('valorCaptacao')} type="number" placeholder="0,00" />
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo de garantia adicional</label>
                        <select value={form.garantiaTipo} onChange={set('garantiaTipo')} className={inputClass}>
                          <option value="">Nenhuma</option>
                          <option value="imovel_rural">Imóvel Rural</option>
                          <option value="penhor_safra">Penhor de Safra</option>
                          <option value="aval">Aval</option>
                          <option value="seguro">Seguro Agrícola</option>
                          <option value="recebiveis">Recebíveis</option>
                        </select>
                      </div>
                      <Field label="Valor da garantia (R$)" value={form.garantiaValor} onChange={set('garantiaValor')} type="number" placeholder="0,00" />
                      {form.garantiaTipo && (
                        <div className="col-span-2">
                          <Field label="Descrição da garantia" value={form.garantiaDescricao} onChange={set('garantiaDescricao')} />
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* Observações */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={set('observacoes')}
                  rows={3}
                  className={inputClass}
                  placeholder="Informações adicionais..."
                />
              </div>

              {/* Custo de emissão — CPR Física (pagamento único) */}
              {form.purpose === 'EMISSAO' && form.type === 'FISICA' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Custo de emissão da CPR Física</p>
                  <p className="text-emerald-600 dark:text-emerald-500 mt-1">
                    <strong>{formatCurrency(pricing.fisicaFlat)}</strong> · pagamento único
                  </p>
                </div>
              )}

              {/* Emissão Financeira — 3% sobre o valor total */}
              {form.purpose === 'EMISSAO' && form.type === 'FINANCEIRA' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Custo de emissão da CPR Financeira</p>
                  {form.precoUnitario && form.quantidade ? (
                    <p className="text-emerald-600 dark:text-emerald-500 mt-1">
                      <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario) * (pricing.financeiraRatePct / 100))}</strong>
                      {' '}· {pricing.financeiraRatePct}% do valor total ({formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario))})
                    </p>
                  ) : (
                    <p className="text-emerald-600 dark:text-emerald-500 mt-1">{pricing.financeiraRatePct}% sobre o valor total da CPR · informe quantidade e preço unitário para calcular</p>
                  )}
                </div>
              )}

              {/* Captação — Fee ConectCampo 6% */}
              {form.purpose === 'CAPTACAO' && form.precoUnitario && form.quantidade && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                  <p className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Valor estimado</p>
                  <p className="text-amber-600 dark:text-amber-500 mt-1">
                    Total: <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario))}</strong>
                    {' '}· Fee ConectCampo ({pricing.captacaoFeeRatePct}%): <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario) * (pricing.captacaoFeeRatePct / 100))}</strong>
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {error}
                </p>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar CPR
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal de assinatura eletrônica */}
      {signModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSignModal(null)}>
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assinatura eletrônica</h2>
              </div>
              <button onClick={() => setSignModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Compartilhe cada link com a parte correspondente. Ao assinar, registramos data, IP e o
                hash do documento como trilha de auditoria.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {signModal.info.provider === 'zapsign' ? 'Assinatura via ZapSign' : 'Assinatura interna'}
              </div>

              {([
                { who: 'emitente', label: 'Emitente', party: signModal.info.emitente },
                { who: 'credor', label: 'Credor', party: signModal.info.credor },
              ] as const).map(({ who, label, party }) => (
                <div key={who} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{party.nome}</p>
                    </div>
                    {party.signedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                        <CheckCircle2 className="h-4 w-4" /> Assinado em {new Date(party.signedAt).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="h-4 w-4" /> Pendente
                      </span>
                    )}
                  </div>
                  {!party.signedAt && (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={partyUrl(party)}
                        className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-gray-600 dark:text-gray-300 truncate"
                      />
                      <button
                        onClick={() => copyLink(party, who)}
                        className="flex items-center gap-1 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-2"
                      >
                        <Copy className="h-3.5 w-3.5" /> {copied === who ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {signModal.info.signatureStatus === 'ASSINADA' && (
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 p-3 text-sm text-teal-700 dark:text-teal-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> CPR totalmente assinada.
                  </div>
                  <button
                    onClick={() => downloadSigned(signModal.cpr.id)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2"
                  >
                    <FileText className="h-3.5 w-3.5" /> Baixar PDF assinado
                  </button>
                </div>
              )}

              {signModal.info.documentHash && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 break-all">
                  Hash SHA-256: {signModal.info.documentHash}
                </p>
              )}

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => resetSignature(signModal.cpr.id)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Gerar novos links
                </button>
                <button
                  onClick={() => setSignModal(null)}
                  className="text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputClass =
  'w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors';

function Field({
  label, value, onChange, required, type = 'text', placeholder, inputMode,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal' | 'search' | 'url' | 'none';
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        step={type === 'number' ? 'any' : undefined}
        className={inputClass}
      />
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100 dark:border-gray-800" />;
}
