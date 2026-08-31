'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Mail, Loader2, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import toast from 'react-hot-toast';

interface Lead {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  amount: number | null;
  termMonths: number | null;
  source: string | null;
  status: string;
  createdAt: string;
}

const LEAD_STATUSES = [
  { value: 'ALL', label: 'Todos' },
  { value: 'NOVO', label: 'Novos' },
  { value: 'CONTATADO', label: 'Contatados' },
  { value: 'QUALIFICADO', label: 'Qualificados' },
  { value: 'CONVERTIDO', label: 'Convertidos' },
  { value: 'DESCARTADO', label: 'Descartados' },
];

const STATUS_STYLE: Record<string, string> = {
  NOVO: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
  CONTATADO: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  QUALIFICADO: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
  CONVERTIDO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  DESCARTADO: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const params = new URLSearchParams({ page: '1', perPage: '100', status });
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Erro ao carregar leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  async function updateStatus(id: string, nextStatus: string) {
    try {
      await api.patch(`/leads/${id}/status`, { status: nextStatus });
      setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status: nextStatus } : lead));
      toast.success('Etapa do lead atualizada.');
    } catch {
      toast.error('Não foi possível atualizar a etapa.');
    }
  }

  const visibleLeads = leads.filter((lead) => {
    const haystack = `${lead.name ?? ''} ${lead.email} ${lead.phone ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-brand-600" /> Leads
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total.toLocaleString('pt-BR')} contatos capturados (simulador e formulários)
          </p>
        </div>
        <button
          onClick={() => { setRefreshing(true); load(); }}
          className="btn-ghost flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Etapas do pipeline">
          {LEAD_STATUSES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={status === item.value}
              onClick={() => setStatus(item.value)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${status === item.value ? 'bg-brand-700 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Buscar leads</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" placeholder="Buscar nome, e-mail ou telefone" />
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
      ) : visibleLeads.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum lead ainda"
          description="Quando alguém usar o simulador de crédito e deixar o e-mail, os contatos aparecerão aqui."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-dark-border">
                <tr>
                  {['Contato', 'Valor', 'Prazo', 'Origem', 'Etapa', 'Data'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {visibleLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{l.name || 'Sem nome informado'}</p>
                      <a href={`mailto:${l.email}`} className="block text-xs text-brand-700 hover:underline dark:text-brand-400">{l.email}</a>
                      <p className="text-xs text-gray-500">{l.phone || 'Telefone não informado'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{l.amount ? formatCurrency(Number(l.amount)) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{l.termMonths ? `${l.termMonths}m` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400">
                        {l.source || 'simulador'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={l.status}
                        onChange={(event) => updateStatus(l.id, event.target.value)}
                        aria-label={`Etapa de ${l.name || l.email}`}
                        className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold ${STATUS_STYLE[l.status] ?? STATUS_STYLE.NOVO}`}
                      >
                        {LEAD_STATUSES.filter((item) => item.value !== 'ALL').map((item) => (
                          <option key={item.value} value={item.value}>{item.label.replace(/s$/, '')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
