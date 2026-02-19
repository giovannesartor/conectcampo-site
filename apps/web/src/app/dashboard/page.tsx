'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  BarChart3,
  FileText,
  CreditCard,
  Users,
  LogOut,
  Bell,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    { label: 'Operações Ativas', value: '0', icon: FileText, color: 'text-blue-500' },
    { label: 'Score Atual', value: '--', icon: BarChart3, color: 'text-green-500' },
    { label: 'Propostas', value: '0', icon: CreditCard, color: 'text-purple-500' },
    { label: 'Parceiros Match', value: '0', icon: Users, color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar-like top bar */}
      <header className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Logo size="sm" href="/dashboard" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="btn-ghost relative">
              <Bell className="h-5 w-5" />
            </button>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role}
                </p>
              </div>
              <button onClick={logout} className="btn-ghost text-red-500 hover:text-red-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bem-vindo, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas operações de crédito agro.
            </p>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Operação
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="card text-center py-16">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Nenhuma operação ainda
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Crie seu perfil de produtor e comece sua primeira operação de crédito.
          </p>
          <button className="btn-primary mt-6">
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Operação
          </button>
        </div>
      </main>
    </div>
  );
}
