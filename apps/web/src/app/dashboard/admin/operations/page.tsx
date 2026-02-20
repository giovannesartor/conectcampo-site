'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDate, formatRelative } from '@/lib/format';
import { api } from '@/lib/api';

const STATUSES = [
  'ALL', 'DRAFT', 'SUBMITTED', 'SCORING', 'MATCHING', 'PROPOSALS_RECEIVED',
  'ACCEPTED', 'IN_ANALYSIS', 'APPROVED', 'REJECTED', 'CONTRACTED', 'COMPLETED', 'CANCELLED',
];

export default function AdminOperationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadOperations();
  }, [user, page, status]);

  async function loadOperations() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20', status });
      const { data } = await api.get(`/admin/operations?${params}`);
      setOperations(data.operations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline Global de Operações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} operações registradas</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'Todos os status' : s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Solicitante</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Prazo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Propostas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className="animate-pulse h-8 bg-gray-100 dark:bg-gray-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Nenhuma operação encontrada
                  </td>
                </tr>
              ) : (
                operations.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{op.user?.name || '—'}</p>
                      <p className="text-xs text-gray-500">{op.user?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={op.type} /></td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{formatCurrency(op.requestedAmount)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">{op.termMonths}m</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {op.score !== null ? (
                        <span className={`font-bold ${op.score >= 70 ? 'text-green-600' : op.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {op.score}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600 dark:text-gray-400">{op.proposalsCount || 0}</td>
                    <td className="px-4 py-3"><StatusBadge status={op.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">{formatRelative(op.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="btn-ghost p-2 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="btn-ghost p-2 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
