'use client';

import { ReactNode, useState, useEffect } from 'react';
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
  Briefcase,
  TrendingUp,
  PieChart,
  Landmark,
  ScrollText,
  UsersRound,
  Sparkles,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsDropdown } from './NotificationsDropdown';
import { OnboardingTour } from './OnboardingTour';
import { api } from '@/lib/api';
import { usePreview } from '@/lib/preview-context';

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  START:       { label: 'Plano START',       color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30',  border: 'border-emerald-200 dark:border-emerald-800' },
  PRO:         { label: 'Plano PRO',          color: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-950/30',         border: 'border-blue-200 dark:border-blue-800' },
  COOPERATIVE: { label: 'Cooperativa',        color: 'text-violet-700 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-950/30',     border: 'border-violet-200 dark:border-violet-800' },
  CORPORATE:   { label: 'Acesso Gratuito',    color: 'text-slate-700 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-800/40',      border: 'border-slate-200 dark:border-slate-700' },
};

const ROLE_LABELS: Record<string, string> = {
  PRODUCER: 'Produtor Rural',
  COMPANY: 'Empresa',
  FINANCIAL_INSTITUTION: 'Instituição Financeira',
  CREDIT_ANALYST: 'Analista de Crédito',
  ADMIN: 'Administrador',
};

// ─── Nav builder per role+plan ────────────────────────────────────────────────

interface NavItem { label: string; href: string; icon: ReactNode; badge?: string }
interface NavSection { title: string; items: NavItem[] }

function buildNav(role: string, plan: string): NavSection[] {
  if (role === 'ADMIN') {
    return [
      {
        title: 'Principal',
        items: [
          { label: 'Visão Geral',        href: '/dashboard',                   icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Operações',          href: '/dashboard/operations',        icon: <FileText className="h-5 w-5" /> },
          { label: 'Propostas',          href: '/dashboard/proposals',         icon: <CreditCard className="h-5 w-5" /> },
          { label: 'Documentos',         href: '/dashboard/documents',         icon: <FolderOpen className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Administração',
        items: [
          { label: 'Painel Admin',       href: '/dashboard/admin',             icon: <Shield className="h-5 w-5" /> },
          { label: 'Usuários',           href: '/dashboard/admin/users',       icon: <Users className="h-5 w-5" /> },
          { label: 'Todas Operações',    href: '/dashboard/admin/operations',  icon: <ClipboardList className="h-5 w-5" /> },
          { label: 'Parceiros',          href: '/dashboard/admin/partners',    icon: <Building2 className="h-5 w-5" /> },
          { label: 'Receita',            href: '/dashboard/admin/revenue',     icon: <DollarSign className="h-5 w-5" /> },
          { label: 'Auditoria',          href: '/dashboard/admin/audit',       icon: <Activity className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Conta',
        items: [
          { label: 'Configurações',      href: '/dashboard/settings',          icon: <Settings className="h-5 w-5" /> },
        ],
      },
    ];
  }

  if (role === 'FINANCIAL_INSTITUTION') {
    return [
      {
        title: 'Deal-flow',
        items: [
          { label: 'Visão Geral',        href: '/dashboard',                   icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Oportunidades',      href: '/dashboard/operations',        icon: <Landmark className="h-5 w-5" /> },
          { label: 'Minhas Propostas',   href: '/dashboard/proposals',         icon: <ScrollText className="h-5 w-5" /> },
          { label: 'Portfólio',          href: '/dashboard/scoring',           icon: <Briefcase className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Análise',
        items: [
          { label: 'Analytics',          href: '/dashboard/matching',           icon: <PieChart className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Conta',
        items: [
          { label: 'Configurações',      href: '/dashboard/settings',          icon: <Settings className="h-5 w-5" /> },
        ],
      },
    ];
  }

  if (plan === 'COOPERATIVE') {
    return [
      {
        title: 'Principal',
        items: [
          { label: 'Visão Geral',            href: '/dashboard',               icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Operações Consolidadas', href: '/dashboard/operations',    icon: <FileText className="h-5 w-5" /> },
          { label: 'Documentos',             href: '/dashboard/documents',     icon: <FolderOpen className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Cooperados',
        items: [
          { label: 'Gestão de Cooperados',   href: '/dashboard/proposals',     icon: <UsersRound className="h-5 w-5" /> },
          { label: 'Relatórios',             href: '/dashboard/scoring',       icon: <BarChart3 className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Conta',
        items: [
          { label: 'Assinatura',             href: '/dashboard/subscription',  icon: <Package className="h-5 w-5" /> },
          { label: 'Configurações',          href: '/dashboard/settings',      icon: <Settings className="h-5 w-5" /> },
        ],
      },
    ];
  }

  if (plan === 'PRO') {
    return [
      {
        title: 'Principal',
        items: [
          { label: 'Visão Geral',        href: '/dashboard',                   icon: <LayoutDashboard className="h-5 w-5" /> },
          { label: 'Operações',          href: '/dashboard/operations',        icon: <FileText className="h-5 w-5" /> },
          { label: 'Propostas',          href: '/dashboard/proposals',         icon: <CreditCard className="h-5 w-5" /> },
          { label: 'Documentos',         href: '/dashboard/documents',         icon: <FolderOpen className="h-5 w-5" /> },
        ],
      },
      {
        title: 'Analytics',
        items: [
          { label: 'Analytics',          href: '/dashboard/scoring',           icon: <TrendingUp className="h-5 w-5" /> },
          { label: 'Score Premium',      href: '/dashboard/scoring',           icon: <Sparkles className="h-5 w-5" />, badge: 'PRO' },
        ],
      },
      {
        title: 'Conta',
        items: [
          { label: 'Assinatura',         href: '/dashboard/subscription',      icon: <Package className="h-5 w-5" /> },
          { label: 'Configurações',      href: '/dashboard/settings',          icon: <Settings className="h-5 w-5" /> },
        ],
      },
    ];
  }

  // Default: START / PRODUCER
  return [
    {
      title: 'Principal',
      items: [
        { label: 'Visão Geral',          href: '/dashboard',                   icon: <LayoutDashboard className="h-5 w-5" /> },
        { label: 'Operações',            href: '/dashboard/operations',        icon: <FileText className="h-5 w-5" /> },
        { label: 'Propostas',            href: '/dashboard/proposals',         icon: <CreditCard className="h-5 w-5" /> },
        { label: 'Documentos',           href: '/dashboard/documents',         icon: <FolderOpen className="h-5 w-5" /> },
      ],
    },
    {
      title: 'Análise',
      items: [
        { label: 'Score ConectCampo',    href: '/dashboard/scoring',           icon: <BarChart3 className="h-5 w-5" /> },
      ],
    },
    {
      title: 'Conta',
      items: [
        { label: 'Assinatura',           href: '/dashboard/subscription',      icon: <Package className="h-5 w-5" /> },
        { label: 'Configurações',        href: '/dashboard/settings',          icon: <Settings className="h-5 w-5" /> },
      ],
    },
  ];
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { previewRole, previewPlan } = usePreview();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [planKey, setPlanKey] = useState<string>('');

  useEffect(() => {
    if (user) {
      api.get('/subscriptions/me').then(({ data }) => {
        if (data?.plan) setPlanKey(data.plan);
      }).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  const isPreviewMode = user.role === 'ADMIN' && !!previewRole;
  const effectiveRole = isPreviewMode ? previewRole! : user.role;
  const effectivePlan = isPreviewMode ? (previewPlan ?? '') : planKey;

  const planInfo = PLAN_LABELS[effectivePlan] ?? null;
  const navSections = buildNav(effectiveRole, effectivePlan);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-dark-border">
        {!collapsed && <Logo size="sm" href="/dashboard" />}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex btn-ghost p-1.5">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden btn-ghost p-1.5">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Plan badge in sidebar */}
      {!collapsed && planInfo && (
        <div className={`mx-3 mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 ${planInfo.bg} ${planInfo.border}`}>
          <Sparkles className={`h-3.5 w-3.5 flex-shrink-0 ${planInfo.color}`} />
          <span className={`text-xs font-semibold truncate ${planInfo.color}`}>{planInfo.label}</span>
        </div>
      )}

      {/* Preview mode indicator */}
      {!collapsed && isPreviewMode && (
        <div className="mx-3 mt-1.5 flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5">
          <Eye className="h-3 w-3 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
            Preview: {ROLE_LABELS[effectiveRole] ?? effectiveRole}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.label + item.href}>
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
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
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
            <div className="h-9 w-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                {isPreviewMode && <Eye className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                {isPreviewMode ? (ROLE_LABELS[effectiveRole] ?? effectiveRole) : (ROLE_LABELS[user.role] ?? user.role)}
              </p>
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
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 lg:relative lg:z-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-[70px]' : 'w-64'}`}
      >
        {sidebar}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden btn-ghost p-1.5">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Bem-vindo, {user.name.split(' ')[0]}
                  </h2>
                  {planInfo && (
                    <span className={`hidden md:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${planInfo.bg} ${planInfo.border} ${planInfo.color}`}>
                      <Sparkles className="h-3 w-3" />
                      {planInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  {isPreviewMode && <Eye className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                  {isPreviewMode
                    ? `Preview: ${ROLE_LABELS[effectiveRole] ?? effectiveRole}`
                    : (ROLE_LABELS[user.role] ?? user.role)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div data-tour="notifications">
                <NotificationsDropdown />
              </div>
              <button onClick={() => router.push('/dashboard/settings')} className="btn-ghost p-2">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      <OnboardingTour />
    </div>
  );
}
