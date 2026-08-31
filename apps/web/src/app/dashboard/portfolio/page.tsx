'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, CalendarClock, CheckCircle2, CircleDollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { ErrorState, PageHeader, Spinner, StatCard } from '@/components/dashboard/PageKit';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

interface PortfolioProposal {
  id: string;
  status: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  validUntil: string;
  operation: {
    id: string;
    purpose?: string;
    type: string;
    producerName: string;
    score: number | null;
  };
}

export default function PortfolioPage() {
  const [proposals, setProposals] = useState<PortfolioProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/operations/portfolio');
      setProposals(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const accepted = proposals.filter((proposal) => proposal.status === 'ACCEPTED');
    const total = proposals.reduce((sum, proposal) => sum + Number(proposal.amount || 0), 0);
    return {
      total,
      accepted: accepted.length,
      acceptedValue: accepted.reduce((sum, proposal) => sum + Number(proposal.amount || 0), 0),
      averageRate: proposals.length ? proposals.reduce((sum, proposal) => sum + Number(proposal.interestRate || 0), 0) / proposals.length : 0,
    };
  }, [proposals]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfólio institucional"
        subtitle="Acompanhe propostas, exposição e operações originadas pela sua instituição."
        icon={<Briefcase className="h-5 w-5" />}
      />
      {error ? <ErrorState onRetry={load} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Propostas enviadas" value={proposals.length} />
            <StatCard label="Volume proposto" value={formatCurrency(metrics.total)} accent />
            <StatCard label="Volume aceito" value={formatCurrency(metrics.acceptedValue)} sub={`${metrics.accepted} propostas aceitas`} />
            <StatCard label="Taxa média" value={metrics.averageRate ? `${metrics.averageRate.toFixed(2)}% a.a.` : '—'} />
          </div>

          <section className="card overflow-hidden p-0">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="font-bold text-gray-950 dark:text-white">Carteira de propostas</h2>
              <p className="mt-1 text-sm text-gray-500">Condições, validade e situação de cada oportunidade.</p>
            </div>
            {proposals.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 font-semibold text-gray-900 dark:text-white">Nenhuma proposta enviada</p>
                <p className="mt-1 text-sm text-gray-500">Explore o deal flow e envie sua primeira proposta.</p>
                <Link href="/dashboard/matching" className="btn-primary mt-5 inline-flex text-sm">Ver oportunidades <ArrowRight className="h-4 w-4" /></Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/60">
                    <tr><th className="px-5 py-3">Operação</th><th className="px-5 py-3">Produtor</th><th className="px-5 py-3">Condição</th><th className="px-5 py-3">Validade</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {proposals.map((proposal) => (
                      <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-5 py-4"><p className="font-semibold text-gray-900 dark:text-white">{proposal.operation.purpose || proposal.operation.type}</p><p className="mt-1 text-xs text-gray-500">{formatCurrency(proposal.amount)}</p></td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{proposal.operation.producerName}</td>
                        <td className="px-5 py-4"><span className="inline-flex items-center gap-1 font-medium"><CircleDollarSign className="h-4 w-4 text-brand-600" />{Number(proposal.interestRate).toFixed(2)}% · {proposal.termMonths}m</span></td>
                        <td className="px-5 py-4 text-gray-500"><span className="inline-flex items-center gap-1"><CalendarClock className="h-4 w-4" />{formatDate(proposal.validUntil)}</span></td>
                        <td className="px-5 py-4"><StatusBadge status={proposal.status} /></td>
                        <td className="px-5 py-4"><Link href={`/dashboard/operations/${proposal.operation.id}`} className="inline-flex items-center gap-1 font-semibold text-brand-700 dark:text-brand-300">Abrir <ArrowRight className="h-4 w-4" /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="card flex items-start gap-3 border-green-100 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div><p className="font-semibold text-green-900 dark:text-green-200">Portfólio isolado por instituição</p><p className="mt-1 text-sm text-green-700 dark:text-green-300">Esta visão considera somente propostas vinculadas à sua instituição financeira.</p></div>
          </div>
        </>
      )}
    </div>
  );
}
