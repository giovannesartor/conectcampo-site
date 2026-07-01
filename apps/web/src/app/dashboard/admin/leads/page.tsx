'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Mail, Loader2, RefreshCw } from 'lucide-react';
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

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/leads?page=1&perPage=100');
      setLeads(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Erro ao carregar leads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

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

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
      ) : leads.length === 0 ? (
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
                  {['E-mail', 'Nome', 'Telefone', 'Valor', 'Prazo', 'Origem', 'Data'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <a href={`mailto:${l.email}`} className="hover:text-brand-600">{l.email}</a>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{l.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{l.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">{l.amount ? formatCurrency(Number(l.amount)) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{l.termMonths ? `${l.termMonths}m` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-950/30 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400">
                        {l.source || 'simulador'}
                      </span>
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
