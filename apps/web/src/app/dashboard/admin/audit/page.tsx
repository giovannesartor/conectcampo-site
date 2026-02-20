'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatDateTime } from '@/lib/format';
import { api } from '@/lib/api';

export default function AdminAuditPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadLogs();
  }, [user, page]);

  async function loadLogs() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/audit-logs', { params: { page, perPage } });
      setLogs(data.data || data || []);
      setTotal(data.total || 0);
    } catch {
      // handle
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  const totalPages = Math.ceil(total / perPage);

  const actionLabels: Record<string, string> = {
    LOGIN: 'Login',
    LOGOUT: 'Logout',
    CREATE: 'Criação',
    UPDATE: 'Atualização',
    DELETE: 'Exclusão',
    PASSWORD_RESET: 'Reset de Senha',
    EMAIL_VERIFICATION: 'Verificação Email',
    ROLE_CHANGE: 'Mudança de Role',
    STATUS_CHANGE: 'Mudança de Status',
  };

  const actionColors: Record<string, string> = {
    LOGIN: 'text-green-600',
    LOGOUT: 'text-gray-500',
    CREATE: 'text-blue-600',
    UPDATE: 'text-yellow-600',
    DELETE: 'text-red-600',
    PASSWORD_RESET: 'text-purple-600',
    EMAIL_VERIFICATION: 'text-brand-600',
    ROLE_CHANGE: 'text-orange-600',
    STATUS_CHANGE: 'text-cyan-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de Auditoria</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {total} registros de atividade no sistema
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhum log registrado</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">As ações dos usuários aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Data/Hora</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ação</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Recurso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{log.user?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{log.user?.email || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${actionColors[log.action] || 'text-gray-600'}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {log.resource || '—'}
                      {log.resourceId && <span className="text-xs text-gray-400 ml-1">#{log.resourceId.slice(0, 8)}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
