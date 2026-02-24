'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, BarChart3 } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPartnersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadPartners();
  }, [user]);

  async function loadPartners() {
    try {
      const { data } = await api.get('/admin/partners');
      setPartners(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parceiros Financeiros</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{partners.length} parceiros ativos</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhum parceiro cadastrado</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Cadastre bancos, FIDCs e investidores na plataforma.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{p.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CNPJ: {p.cnpj || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={p.type} />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ticket</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(p.minTicket)} - {formatCurrency(p.maxTicket)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Matches</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.matchesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Propostas</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.proposalsCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
                <p className="text-xs text-gray-400">Score mínimo: {p.minScore || '—'}</p>
                <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
