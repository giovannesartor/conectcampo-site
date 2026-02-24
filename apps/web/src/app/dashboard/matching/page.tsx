'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, ArrowRight, TrendingUp, MapPin, Leaf, DollarSign, Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import Link from 'next/link';

const CROPS = ['Todos', 'Soja', 'Milho', 'Café', 'Algodão', 'Arroz', 'Trigo', 'Cana-de-açúcar', 'Feijão', 'Pecuária (Corte)', 'Outro'];
const STATUS_OPTIONS = ['Todos', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

const OP_TYPE_LABELS: Record<string, string> = {
  CPR_FINANCIAL: 'CPR Financeira',
  CPR_PHYSICAL: 'CPR Física',
  CDCA: 'CDCA',
  CRA: 'CRA',
  LCA: 'LCA',
  FIAGRO: 'FIAGRO',
};

export default function MatchingPage() {
  const [operations, setOperations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Proposal modal state
  const [proposalOp, setProposalOp] = useState<any>(null);
  const [proposalForm, setProposalForm] = useState({ amount: '', interestRate: '', termMonths: '12', notes: '' });

  useEffect(() => {
    loadOperations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [operations, search, cropFilter, statusFilter]);

  async function loadOperations() {
    try {
      const { data } = await api.get('/operations?page=1&perPage=100&status=SUBMITTED,UNDER_REVIEW,APPROVED');
      setOperations(data.data || data);
    } catch {
      toast.error('Erro ao carregar operações disponíveis.');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...operations];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (op) =>
          op.crop?.toLowerCase().includes(q) ||
          op.farmLocation?.toLowerCase().includes(q) ||
          op.type?.toLowerCase().includes(q) ||
          op.producerName?.toLowerCase().includes(q)
      );
    }
    if (cropFilter !== 'Todos') {
      result = result.filter((op) => op.crop === cropFilter);
    }
    if (statusFilter !== 'Todos') {
      result = result.filter((op) => op.status === statusFilter);
    }
    setFiltered(result);
  }

  async function handleSendProposal() {
    if (!proposalOp) return;
    setSubmitting(proposalOp.id);
    try {
      await api.post('/operations/proposals', {
        operationId: proposalOp.id,
        amount: parseFloat(proposalForm.amount.replace(/\D/g, '')) / 100,
        interestRate: parseFloat(proposalForm.interestRate),
        termMonths: parseInt(proposalForm.termMonths),
        notes: proposalForm.notes,
      });
      toast.success('Proposta enviada com sucesso!');
      setProposalOp(null);
      setProposalForm({ amount: '', interestRate: '', termMonths: '12', notes: '' });
    } catch {
      toast.error('Erro ao enviar proposta. Tente novamente.');
    } finally {
      setSubmitting(null);
    }
  }

  const totalVolume = filtered.reduce((sum, op) => sum + (op.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deal-flow & Matching</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Operações abertas para análise e propostas de financiamento
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="card !p-3 text-center min-w-[100px]">
            <p className="text-lg font-bold text-brand-600">{filtered.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Oportunidades</p>
          </div>
          <div className="card !p-3 text-center min-w-[140px]">
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalVolume)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Volume total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label text-xs mb-1 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cultura, localização, tipo..."
              className="input pl-9 w-full text-sm"
            />
          </div>
        </div>
        <div>
          <label className="label text-xs mb-1 block">Cultura</label>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="input text-sm min-w-[140px]"
          >
            {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs mb-1 block">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'Todos' ? 'Todos' : s === 'SUBMITTED' ? 'Submetida' : s === 'UNDER_REVIEW' ? 'Em análise' : 'Aprovada'}</option>
            ))}
          </select>
        </div>
        <button onClick={loadOperations} className="btn-ghost flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Operations list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingUp className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhuma oportunidade encontrada</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {search || cropFilter !== 'Todos' || statusFilter !== 'Todos'
              ? 'Tente ajustar os filtros acima.'
              : 'Novas operações aparecerão aqui quando submetidas pelos produtores.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((op) => (
            <div key={op.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {OP_TYPE_LABELS[op.type] || op.type}
                    </span>
                    <StatusBadge status={op.status} />
                    <span className="text-xs text-gray-400">#{op.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    {op.crop && (
                      <span className="flex items-center gap-1.5">
                        <Leaf className="h-3.5 w-3.5 text-green-500" />
                        {op.crop}
                      </span>
                    )}
                    {op.farmLocation && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        {op.farmLocation}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                      {formatCurrency(op.amount || 0)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-purple-500" />
                      {op.termMonths} meses
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(op.createdAt)}
                    </span>
                  </div>
                  {op.purpose && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Finalidade: {op.purpose}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/operations/${op.id}`}
                    className="btn-ghost text-sm flex items-center gap-1.5"
                  >
                    Detalhes <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => setProposalOp(op)}
                    className="btn-primary text-sm"
                  >
                    Enviar Proposta
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proposal modal */}
      {proposalOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 dark:border-dark-border">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enviar Proposta</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {OP_TYPE_LABELS[proposalOp.type]} — {proposalOp.crop} — {formatCurrency(proposalOp.amount || 0)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Valor proposto (R$)</label>
                <input
                  type="text"
                  value={proposalForm.amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '');
                    const n = parseInt(v || '0') / 100;
                    setProposalForm((p) => ({ ...p, amount: n > 0 ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '' }));
                  }}
                  placeholder="0,00"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Taxa de juros (% a.a.)</label>
                <input
                  type="number"
                  value={proposalForm.interestRate}
                  onChange={(e) => setProposalForm((p) => ({ ...p, interestRate: e.target.value }))}
                  placeholder="Ex: 12.5"
                  step="0.1"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Prazo (meses)</label>
                <select
                  value={proposalForm.termMonths}
                  onChange={(e) => setProposalForm((p) => ({ ...p, termMonths: e.target.value }))}
                  className="input w-full"
                >
                  {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                    <option key={m} value={m.toString()}>{m} meses</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Observações (opcional)</label>
                <textarea
                  value={proposalForm.notes}
                  onChange={(e) => setProposalForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Condições especiais, documentos necessários..."
                  className="input w-full resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-dark-border flex gap-3 justify-end">
              <button
                onClick={() => setProposalOp(null)}
                className="btn-ghost"
                disabled={submitting === proposalOp.id}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendProposal}
                disabled={!proposalForm.amount || !proposalForm.interestRate || submitting === proposalOp.id}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitting === proposalOp.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Enviar Proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
