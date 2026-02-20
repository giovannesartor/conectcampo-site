'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Users,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight,
  Building2,
  DollarSign,
  Activity,
  Package,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: string[];
  badge?: number;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Visão Geral', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Operações', href: '/dashboard/operations', icon: <FileText className="h-5 w-5" />, roles: ['PRODUCER', 'COMPANY', 'ADMIN'] },
      { label: 'Propostas', href: '/dashboard/proposals', icon: <CreditCard className="h-5 w-5" />, roles: ['PRODUCER', 'COMPANY', 'ADMIN'] },
      { label: 'Documentos', href: '/dashboard/documents', icon: <FolderOpen className="h-5 w-5" />, roles: ['PRODUCER', 'COMPANY', 'ADMIN'] },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { label: 'Minha Assinatura', href: '/dashboard/subscription', icon: <Package className="h-5 w-5" />, roles: ['PRODUCER', 'COMPANY'] },
      { label: 'Score & Rating', href: '/dashboard/scoring', icon: <BarChart3 className="h-5 w-5" />, roles: ['PRODUCER', 'COMPANY'] },
    ],
  },
  {
    title: 'Administração',
    items: [
      { label: 'Painel Admin', href: '/dashboard/admin', icon: <Shield className="h-5 w-5" />, roles: ['ADMIN'] },
      { label: 'Usuários', href: '/dashboard/admin/users', icon: <Users className="h-5 w-5" />, roles: ['ADMIN'] },
      { label: 'Todas Operações', href: '/dashboard/admin/operations', icon: <ClipboardList className="h-5 w-5" />, roles: ['ADMIN'] },
      { label: 'Parceiros', href: '/dashboard/admin/partners', icon: <Building2 className="h-5 w-5" />, roles: ['ADMIN'] },
      { label: 'Receita', href: '/dashboard/admin/revenue', icon: <DollarSign className="h-5 w-5" />, roles: ['ADMIN'] },
      { label: 'Auditoria', href: '/dashboard/admin/audit', icon: <Activity className="h-5 w-5" />, roles: ['ADMIN'] },
    ],
  },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(user.role),
      ),
    }))
    .filter((section) => section.items.length > 0);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-dark-border">
        {!collapsed && <Logo size="sm" href="/dashboard" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex btn-ghost p-1.5"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden btn-ghost p-1.5"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-brand-600 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 dark:border-dark-border px-4 py-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="w-full flex justify-center text-gray-400 hover:text-red-500" title="Sair">
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 lg:relative lg:z-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-[70px]' : 'w-64'}`}
      >
        {sidebar}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden btn-ghost p-1.5"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Olá, {user.name.split(' ')[0]}!
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.role === 'ADMIN' ? 'Administrador' :
                   user.role === 'PRODUCER' ? 'Produtor Rural' :
                   user.role === 'COMPANY' ? 'Empresa' :
                   user.role === 'FINANCIAL_INSTITUTION' ? 'Instituição Financeira' :
                   user.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="btn-ghost relative p-2">
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push('/dashboard/settings')}
                className="btn-ghost p-2"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
