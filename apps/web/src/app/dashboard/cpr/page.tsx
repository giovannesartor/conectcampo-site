'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

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
  createdAt: string;
}

interface CreateCprForm {
  purpose: 'EMISSAO' | 'CAPTACAO';
  type: 'FISICA' | 'FINANCEIRA';
  emitenteNome: string;
  emitenteCpfCnpj: string;
  emitenteCidade: string;
  emitenteEstado: string;
  emitenteCarNumero: string;
  credorNome: string;
  credorCpfCnpj: string;
  credorTipo: string;
  produto: string;
  quantidade: string;
  unidade: string;
  safraAno: string;
  precoUnitario: string;
  localEntrega: string;
  dataEntrega: string;
  dataVencimento: string;
  prazoMeses: string;
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
  credorNome: '', credorCpfCnpj: '', credorTipo: '',
  produto: '', quantidade: '', unidade: 'sacas', safraAno: '', precoUnitario: '',
  localEntrega: '', dataEntrega: '',
  dataVencimento: '', prazoMeses: '',
  garantiaTipo: '', garantiaDescricao: '', garantiaValor: '',
  finalidade: '', valorCaptacao: '',
  observacoes: '',
};

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
        credorNome: form.credorNome,
        credorCpfCnpj: form.credorCpfCnpj,
        credorTipo: form.credorTipo || undefined,
        produto: form.produto,
        quantidade: parseFloat(form.quantidade),
        unidade: form.unidade,
        safraAno: form.safraAno || undefined,
        precoUnitario: form.precoUnitario ? parseFloat(form.precoUnitario) : undefined,
        localEntrega: form.localEntrega || undefined,
        dataEntrega: form.dataEntrega || undefined,
        dataVencimento: form.dataVencimento,
        prazoMeses: form.prazoMeses ? parseInt(form.prazoMeses) : undefined,
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

  const f = (v: unknown) => form[v as keyof CreateCprForm];
  const set = (k: keyof CreateCprForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

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
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
          <ScrollText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma CPR criada ainda</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Clique em "Nova CPR" para emitir ou usar uma CPR para captação</p>
        </div>
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
                        {p === 'EMISSAO' ? '📄 Emissão de CPR' : '🏦 Captação de Crédito'}
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
                    <option value="FINANCEIRA">Financeira (liquidação em dinheiro)</option>
                    <option value="FISICA">Física (entrega do produto)</option>
                  </select>
                </div>
              </section>

              <Divider />

              {/* Emitente */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Emitente (Produtor Rural)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Field label="Nome completo *" value={form.emitenteNome} onChange={set('emitenteNome')} required /></div>
                  <Field label="CPF / CNPJ *" value={form.emitenteCpfCnpj} onChange={set('emitenteCpfCnpj')} required placeholder="000.000.000-00" />
                  <Field label="Número CAR" value={form.emitenteCarNumero} onChange={set('emitenteCarNumero')} placeholder="SP-XXXXXXX-XXXX..." />
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
                  <Field label="CPF / CNPJ *" value={form.credorCpfCnpj} onChange={set('credorCpfCnpj')} required />
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
                  <Field label="Safra" value={form.safraAno} onChange={set('safraAno')} placeholder="2025/2026" />
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

              {/* Vencimento */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Vencimento</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data de vencimento *" value={form.dataVencimento} onChange={set('dataVencimento')} required type="date" />
                  <Field label="Prazo (meses)" value={form.prazoMeses} onChange={set('prazoMeses')} type="number" placeholder="12" />
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

              {/* Fee info */}
              {form.precoUnitario && form.quantidade && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium">💰 Valor estimado</p>
                  <p className="text-emerald-600 dark:text-emerald-500 mt-1">
                    Total: <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario))}</strong>
                    {' '}· Fee ConectCampo (6%): <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario) * 0.06)}</strong>
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
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputClass =
  'w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors';

function Field({
  label, value, onChange, required, type = 'text', placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
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
        step={type === 'number' ? 'any' : undefined}
        className={inputClass}
      />
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100 dark:border-gray-800" />;
}
