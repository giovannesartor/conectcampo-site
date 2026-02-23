'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { api } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  CUSTEIO: 'Custeio',
  INVESTIMENTO: 'Investimento',
  GIRO: 'Capital de Giro',
  MERCADO_CAPITAIS: 'Mercado de Capitais',
};

const GUARANTEE_LABELS: Record<string, string> = {
  IMOVEL_RURAL: 'Imóvel Rural',
  PENHOR_SAFRA: 'Penhor de Safra',
  ALIENACAO_FIDUCIARIA: 'Alienação Fiduciária',
  AVAL: 'Aval',
  RECEBIVEIS: 'Recebíveis',
  CPR_FINANCEIRA: 'CPR Financeira',
  SEGURO: 'Seguro',
  FUNDO_GARANTIDOR: 'Fundo Garantidor',
  OUTRO: 'Outro',
};

interface Operation {
  id: string;
  type: string;
  status: string;
  requestedAmount: number;
  termMonths: number;
  purpose: string;
  guarantees: string[];
  guaranteeValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  riskScore?: {
    id: string;
    totalScore: number;
    riskProfile: string;
    financialScore: number;
    operationalScore: number;
    documentScore: number;
    marketScore: number;
  };
  matchResults?: {
    id: string;
    rank: number;
    score: number;
    partner: { id: string; name: string; type: string };
  }[];
  proposals?: {
    id: string;
    interestRate: number;
    termMonths: number;
    amount: number;
    status: string;
    createdAt: string;
    partner: { id: string; name: string; type: string };
  }[];
  documents?: {
    id: string;
    type: string;
    fileName: string;
    createdAt: string;
  }[];
  contract?: {
    id: string;
    signedAt?: string;
    value: number;
  };
}

export default function OperationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [operation, setOperation] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOperation();
    }
  }, [params.id]);

  async function loadOperation() {
    setLoading(true);
    try {
      const { data } = await api.get(`/operations/${params.id}`);
      setOperation(data);
    } catch {
      router.push('/dashboard/operations');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!operation) return;
    setSubmitting(true);
    try {
      await api.patch(`/operations/${operation.id}/submit`);
      await loadOperation();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!operation) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/operations')}
          className="btn-ghost p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {TYPE_LABELS[operation.type] || operation.type}
            </h1>
            <StatusBadge status={operation.status} size="md" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Criada em {formatDate(operation.createdAt)} · Atualizada em {formatDateTime(operation.updatedAt)}
          </p>
        </div>
        {operation.status === 'DRAFT' && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Enviando...' : 'Submeter para Análise'}
          </button>
        )}
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valor Solicitado</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(operation.requestedAmount)}
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prazo</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {operation.termMonths} meses
            </p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Garantias</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(operation.guaranteeValue)}
            </p>
          </div>
        </div>
        {operation.riskScore && (
          <div className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {operation.riskScore.totalScore}/100
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operation details */}
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhes da Operação</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Finalidade</p>
              <p className="text-gray-900 dark:text-white">{operation.purpose}</p>
            </div>
            {operation.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Observações</p>
                <p className="text-gray-900 dark:text-white">{operation.notes}</p>
              </div>
            )}
            {operation.guarantees.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Garantias oferecidas</p>
                <div className="flex flex-wrap gap-2">
                  {operation.guarantees.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {GUARANTEE_LABELS[g] || g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Risk Score */}
        {operation.riskScore && (
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Score de Risco</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Perfil de Risco</span>
                <StatusBadge status={operation.riskScore.riskProfile} />
              </div>
              {[
                { label: 'Financeiro', value: operation.riskScore.financialScore },
                { label: 'Operacional', value: operation.riskScore.operationalScore },
                { label: 'Documental', value: operation.riskScore.documentScore },
                { label: 'Mercado', value: operation.riskScore.marketScore },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}/25</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(value / 25) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proposals */}
      {operation.proposals && operation.proposals.length > 0 && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Propostas Recebidas ({operation.proposals.length})
          </h3>
          <div className="space-y-3">
            {operation.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="p-4 rounded-lg border border-gray-100 dark:border-dark-border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{proposal.partner.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(proposal.amount)} · {proposal.interestRate}% a.a. · {proposal.termMonths} meses
                    </p>
                  </div>
                  <StatusBadge status={proposal.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Results */}
      {operation.matchResults && operation.matchResults.length > 0 && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-brand-600" />
            Instituições Compatíveis ({operation.matchResults.length})
          </h3>
          <div className="space-y-2">
            {operation.matchResults.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-600 w-6">#{match.rank}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{match.partner.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <StatusBadge status={match.partner.type} size="sm" />
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Score: {match.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {operation.documents && operation.documents.length > 0 && (
        <div className="card space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos ({operation.documents.length})
          </h3>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {operation.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.fileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{doc.type} · {formatDate(doc.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
