'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string };
}

interface Filters {
  search: string;
  action: string;
  entity: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
  'PASSWORD_RESET', 'EMAIL_VERIFICATION', 'ROLE_CHANGE', 'STATUS_CHANGE',
];

const ACTION_LABELS: Record<string, string> = {
  LOGIN:              'Login',
  LOGOUT:             'Logout',
  CREATE:             'Criação',
  UPDATE:             'Atualização',
  DELETE:             'Exclusão',
  PASSWORD_RESET:     'Reset de Senha',
  EMAIL_VERIFICATION: 'Verificação Email',
  ROLE_CHANGE:        'Mudança de Role',
  STATUS_CHANGE:      'Mudança de Status',
};

const ACTION_CLASSES: Record<string, string> = {
  LOGIN:              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  LOGOUT:             'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CREATE:             'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  UPDATE:             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DELETE:             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PASSWORD_RESET:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  EMAIL_VERIFICATION: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  ROLE_CHANGE:        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  STATUS_CHANGE:      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_CLASSES[action] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

function JsonDiff({ label, value }: { label: string; value: unknown }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <pre className="text-xs bg-gray-50 dark:bg-dark-bg rounded p-2 overflow-x-auto max-h-40 text-gray-800 dark:text-gray-200">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function ExpandedRow({ log }: { log: AuditLog }) {
  const hasDetails = log.oldValue || log.newValue || log.userAgent;
  if (!hasDetails) {
    return (
      <tr className="bg-gray-50/50 dark:bg-dark-bg/30">
        <td colSpan={6} className="px-6 py-3 text-xs text-gray-400 italic">Sem detalhes adicionais.</td>
      </tr>
    );
  }
  return (
    <tr className="bg-gray-50/50 dark:bg-dark-bg/30">
      <td colSpan={6} className="px-6 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!!log.oldValue && <JsonDiff label="Valor anterior" value={log.oldValue} />}
          {!!log.newValue && <JsonDiff label="Novo valor"    value={log.newValue} />}
          {log.userAgent && (
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User Agent</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all">{log.userAgent}</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  const { user, isLoading } = useAuth();
  const router              = useRouter();

  const [logs,     setLogs]     = useState<AuditLog[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [stats,    setStats]    = useState<{ action: string; count: number }[]>([]);

  const [filters, setFilters] = useState<Filters>({
    search: '', action: '', entity: '', dateFrom: '', dateTo: '',
  });
  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);

  const perPage = 50;

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, isLoading, router]);

  // ── Load logs ──────────────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, perPage, ...filters };
      // strip empty strings
      Object.keys(params).forEach((k) => { if (params[k] === '') delete params[k]; });
      const { data } = await api.get('/admin/audit-logs', { params });
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Erro ao carregar logs de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [user, page, filters]);

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!user || user.role !== 'ADMIN') return;
    try {
      const { data } = await api.get('/admin/audit-logs/stats');
      setStats(Array.isArray(data) ? data : []);
    } catch {
      // stats are non-critical
    }
  }, [user]);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function applyFilters() {
    setFilters(pendingFilters);
    setPage(1);
  }

  function clearFilters() {
    const empty: Filters = { search: '', action: '', entity: '', dateFrom: '', dateTo: '' };
    setPendingFilters(empty);
    setFilters(empty);
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params: Record<string, unknown> = { ...filters };
      Object.keys(params).forEach((k) => { if (params[k] === '') delete params[k]; });
      const { data } = await api.get('/admin/audit-logs/export', { params, responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar logs.');
    } finally {
      setExporting(false);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  const totalPages    = Math.ceil(total / perPage);
  const hasActiveFilter = filters.search || filters.action || filters.entity || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-600" />
            Auditoria
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total.toLocaleString('pt-BR')} registros de atividade
            {hasActiveFilter && <span className="ml-1 text-brand-600">(filtrado)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            title="Atualizar"
            className="btn-ghost p-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.slice(0, 5).map((s) => (
            <button
              key={s.action}
              onClick={() => {
                const a = pendingFilters.action === s.action ? '' : s.action;
                setPendingFilters((f) => ({ ...f, action: a }));
                setFilters((f) => ({ ...f, action: a }));
                setPage(1);
              }}
              className={`card p-3 text-left transition-all hover:ring-2 hover:ring-brand-400 ${
                filters.action === s.action ? 'ring-2 ring-brand-500' : ''
              }`}
            >
              <p className="text-lg font-bold text-gray-900 dark:text-white">{s.count.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <ActionBadge action={s.action} />
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by user */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nome ou email"
              value={pendingFilters.search}
              onChange={(e) => setPendingFilters((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="input pl-9 w-full"
            />
          </div>

          {/* Action */}
          <select
            value={pendingFilters.action}
            onChange={(e) => setPendingFilters((f) => ({ ...f, action: e.target.value }))}
            className="input w-full"
          >
            <option value="">Todas as ações</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a] ?? a}</option>
            ))}
          </select>

          {/* Entity */}
          <input
            type="text"
            placeholder="Recurso (ex: User, Operation)"
            value={pendingFilters.entity}
            onChange={(e) => setPendingFilters((f) => ({ ...f, entity: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="input w-full"
          />

          {/* Date from */}
          <input
            type="date"
            value={pendingFilters.dateFrom}
            onChange={(e) => setPendingFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="input w-full"
          />

          {/* Date to */}
          <input
            type="date"
            value={pendingFilters.dateTo}
            onChange={(e) => setPendingFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="input w-full"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={applyFilters} className="btn-primary text-sm px-4 py-1.5">
            Filtrar
          </button>
          {hasActiveFilter && (
            <button onClick={clearFilters} className="btn-ghost text-sm flex items-center gap-1">
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800 rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhum log encontrado</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {hasActiveFilter ? 'Tente ajustar os filtros.' : 'As ações dos usuários aparecerão aqui.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
                <tr>
                  <th className="w-8 px-3" />
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Data/Hora</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ação</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Recurso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {logs.map((log) => {
                  const isOpen = expanded === log.id;
                  return (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : log.id)}
                      >
                        <td className="px-3 py-3 text-gray-400">
                          {isOpen
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{log.user?.name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{log.user?.email ?? '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          <span className="font-mono text-xs">{log.entity}</span>
                          {log.entityId && (
                            <span className="text-xs text-gray-400 ml-1">#{log.entityId.slice(0, 8)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                          {log.ipAddress ?? '—'}
                        </td>
                      </tr>
                      {isOpen && <ExpandedRow key={`${log.id}-exp`} log={log} />}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages} · {total.toLocaleString('pt-BR')} registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {/* Page numbers (max 5) */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      pg === page
                        ? 'bg-brand-600 text-white'
                        : 'btn-ghost'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
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
