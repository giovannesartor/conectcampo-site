'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { CreditCard, Check, X, Clock, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    try {
      const { data } = await api.get('/operations/proposals');
      setProposals(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(proposalId: string) {
    try {
      await api.patch(`/operations/proposals/${proposalId}/accept`);
      loadProposals();
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    }
  }

  async function handleReject(proposalId: string) {
    try {
      await api.patch(`/operations/proposals/${proposalId}/reject`);
      loadProposals();
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Propostas Recebidas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Propostas de financiamento dos parceiros financeiros
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
        <div className="space-y-4">
          {proposals.map((proposal) => (
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
                      Operação: {proposal.operation?.type || '—'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={proposal.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-gray-100 dark:border-dark-border">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(proposal.amount || proposal.operation?.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de Juros</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {proposal.interestRate ? `${proposal.interestRate}% a.a.` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Prazo</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {proposal.termMonths || proposal.operation?.termMonths || '—'} meses
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recebida em</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
              </div>

              {proposal.status === 'PENDING' && (
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => handleAccept(proposal.id)} className="btn-primary flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4" />
                    Aceitar
                  </button>
                  <button onClick={() => handleReject(proposal.id)} className="btn-ghost text-red-600 flex items-center gap-2 text-sm">
                    <X className="h-4 w-4" />
                    Recusar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
