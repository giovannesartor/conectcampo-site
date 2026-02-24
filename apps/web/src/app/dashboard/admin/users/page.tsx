'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserX,
  UserCheck,
  Mail,
} from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { formatDate, formatRelative } from '@/lib/format';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const ROLES = ['ALL', 'PRODUCER', 'COMPANY', 'FINANCIAL_INSTITUTION', 'CREDIT_ANALYST', 'ADMIN'];

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [role, setRole] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) router.push('/dashboard');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadUsers();
  }, [user, page, role]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: '20', role });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string) {
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      loadUsers();
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Usuários</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} usuários cadastrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="input pl-10"
          />
        </form>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === 'ALL' ? 'Todos os perfis' : r}
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
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Operações</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Último Login</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Cadastro</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4">
                      <div className="animate-pulse h-8 bg-gray-100 dark:bg-gray-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-950/30 flex items-center justify-center text-brand-700 dark:text-brand-400 text-xs font-bold shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">{u._count?.operations ?? 0}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        {u.isActive ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Nunca'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          u.isActive
                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                        }`}
                      >
                        {u.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-dark-border">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="btn-ghost p-2 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="btn-ghost p-2 disabled:opacity-50"
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
