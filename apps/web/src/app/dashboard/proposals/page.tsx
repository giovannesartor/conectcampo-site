'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Check, X, GitCompareArrows, TrendingDown, Award, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface Proposal {
  id: string;
  status: string;
  amount?: number;
  interestRate?: number;
  termMonths?: number;
  conditions?: string;
  validUntil?: string;
  createdAt: string;
  partner?: { name?: string };
  operation?: { id?: string; type?: string; amount?: number; termMonths?: number };
}

// Parcela (PMT) e total estimados
function pmt(amount?: number, annualRatePct?: number, months?: number): number | null {
  if (!amount || !months) return null;
  const r = (Number(annualRatePct ?? 0) / 100) / 12;
  if (r === 0) return amount / months;
  return (amount * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareOpId, setCompareOpId] = useState<string | null>(null);

  useEffect(() => { loadProposals(); }, []);

  async function loadProposals() {
    try {
      const { data } = await api.get('/operations/proposals');
      setProposals(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Ocorreu um erro ao carregar as propostas.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id: string) {
    try {
      await api.patch(`/operations/proposals/${id}/accept`);
      toast.success('Proposta aceita!');
      setCompareOpId(null);
      loadProposals();
    } catch {
      toast.error('Não foi possível aceitar a proposta.');
    }
  }

  async function handleReject(id: string) {
    try {
      await api.patch(`/operations/proposals/${id}/reject`);
      toast('Proposta recusada.');
      loadProposals();
    } catch {
      toast.error('Não foi possível recusar a proposta.');
    }
  }

  // Agrupa por operação
  const groups = useMemo(() => {
    const map = new Map<string, { opId: string; opType: string; items: Proposal[] }>();
    for (const p of proposals) {
      const opId = p.operation?.id ?? 'sem-operacao';
      if (!map.has(opId)) map.set(opId, { opId, opType: p.operation?.type ?? 'Operação', items: [] });
      const group = map.get(opId);
      if (group) group.items.push(p);
    }
    return Array.from(map.values());
  }, [proposals]);

  const compareItems = useMemo(
    () => (compareOpId ? groups.find((g) => g.opId === compareOpId)?.items ?? [] : []),
    [compareOpId, groups],
  );

  // melhores valores no grupo em comparação
  const best = useMemo(() => {
    if (compareItems.length === 0) return { rate: null as number | null, total: null as number | null };
    const rates = compareItems.map((p) => Number(p.interestRate ?? Infinity));
    const totals = compareItems.map((p) => {
      const m = pmt(p.amount, p.interestRate, p.termMonths);
      return m ? m * Number(p.termMonths) : Infinity;
    });
    return { rate: Math.min(...rates), total: Math.min(...totals) };
  }, [compareItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Propostas Recebidas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Propostas de financiamento dos parceiros — compare lado a lado e escolha a melhor.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhuma proposta recebida"
          description="Quando suas operações forem compatíveis com parceiros financeiros, as propostas aparecerão aqui."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.opId}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {group.opType}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {group.items.length} proposta{group.items.length > 1 ? 's' : ''}
                  </span>
                </h2>
                {group.items.length > 1 && (
                  <button
                    onClick={() => setCompareOpId(group.opId)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    <GitCompareArrows className="h-4 w-4" /> Comparar {group.items.length}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {group.items.map((proposal) => (
                  <div key={proposal.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {proposal.partner?.name || 'Parceiro Financeiro'}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Recebida em {formatDate(proposal.createdAt)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={proposal.status} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-gray-100 dark:border-dark-border">
                      <Metric label="Valor" value={formatCurrency(proposal.amount || proposal.operation?.amount || 0)} />
                      <Metric label="Taxa de Juros" value={proposal.interestRate ? `${proposal.interestRate}% a.a.` : '—'} />
                      <Metric label="Prazo" value={`${proposal.termMonths || proposal.operation?.termMonths || '—'} meses`} />
                      <Metric
                        label="Parcela estimada"
                        value={(() => { const m = pmt(proposal.amount, proposal.interestRate, proposal.termMonths); return m ? formatCurrency(m) : '—'; })()}
                      />
                    </div>

                    {proposal.status === 'PENDING' && (
                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => handleAccept(proposal.id)} className="btn-primary flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4" /> Aceitar
                        </button>
                        <button onClick={() => handleReject(proposal.id)} className="btn-ghost text-red-600 flex items-center gap-2 text-sm">
                          <X className="h-4 w-4" /> Recusar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal comparador */}
      {compareOpId && compareItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setCompareOpId(null)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comparar propostas</h2>
              </div>
              <button onClick={() => setCompareOpId(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-xs font-medium text-gray-400"></th>
                    {compareItems.map((p) => (
                      <th key={p.id} className="p-2 text-left font-semibold text-gray-900 dark:text-white min-w-[150px]">
                        {p.partner?.name || 'Parceiro'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="Valor" items={compareItems} render={(p) => formatCurrency(p.amount || 0)} />
                  <CompareRow
                    label="Taxa a.a."
                    items={compareItems}
                    render={(p) => (p.interestRate ? `${p.interestRate}%` : '—')}
                    highlight={(p) => Number(p.interestRate) === best.rate}
                  />
                  <CompareRow label="Prazo" items={compareItems} render={(p) => `${p.termMonths || '—'} meses`} />
                  <CompareRow
                    label="Parcela estimada"
                    items={compareItems}
                    render={(p) => { const m = pmt(p.amount, p.interestRate, p.termMonths); return m ? formatCurrency(m) : '—'; }}
                  />
                  <CompareRow
                    label="Total estimado"
                    items={compareItems}
                    render={(p) => { const m = pmt(p.amount, p.interestRate, p.termMonths); return m ? formatCurrency(m * Number(p.termMonths)) : '—'; }}
                    highlight={(p) => { const m = pmt(p.amount, p.interestRate, p.termMonths); return !!m && m * Number(p.termMonths) === best.total; }}
                  />
                  <CompareRow label="Garantias" items={compareItems} render={(p) => p.conditions || '—'} />
                  <CompareRow label="Válida até" items={compareItems} render={(p) => (p.validUntil ? formatDate(p.validUntil) : '—')} />
                  <tr>
                    <td className="p-2"></td>
                    {compareItems.map((p) => (
                      <td key={p.id} className="p-2">
                        {p.status === 'PENDING' ? (
                          <button onClick={() => handleAccept(p.id)} className="btn-primary text-xs w-full justify-center">
                            <Check className="h-3.5 w-3.5" /> Aceitar
                          </button>
                        ) : (
                          <StatusBadge status={p.status} />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-emerald-600" /> menor taxa em destaque</span>
                <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5 text-emerald-600" /> menor custo total em destaque</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> parcela/total são estimativas (sistema Price)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function CompareRow({
  label, items, render, highlight,
}: {
  label: string;
  items: Proposal[];
  render: (p: Proposal) => string;
  highlight?: (p: Proposal) => boolean;
}) {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-800">
      <td className="p-2 text-xs font-medium text-gray-400 whitespace-nowrap">{label}</td>
      {items.map((p) => {
        const isBest = highlight?.(p);
        return (
          <td
            key={p.id}
            className={`p-2 ${isBest ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded' : 'text-gray-900 dark:text-white'}`}
          >
            {render(p)}
          </td>
        );
      })}
    </tr>
  );
}
