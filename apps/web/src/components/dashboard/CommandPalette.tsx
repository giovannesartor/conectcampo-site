'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutDashboard, FileText, CreditCard, FolderOpen, BarChart3,
  ScrollText, Leaf, Settings, Users, Landmark, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Cmd {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  keywords?: string;
}

const NAV: Cmd[] = [
  { id: 'overview', label: 'Visão Geral', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, keywords: 'inicio home dashboard' },
  { id: 'ops', label: 'Operações', href: '/dashboard/operations', icon: <FileText className="h-4 w-4" />, keywords: 'credito operacao' },
  { id: 'newop', label: 'Nova operação', sub: 'Solicitar crédito', href: '/dashboard/operations/new', icon: <FileText className="h-4 w-4" />, keywords: 'criar solicitar credito' },
  { id: 'proposals', label: 'Propostas', href: '/dashboard/proposals', icon: <CreditCard className="h-4 w-4" />, keywords: 'oferta banco' },
  { id: 'docs', label: 'Documentos', href: '/dashboard/documents', icon: <FolderOpen className="h-4 w-4" />, keywords: 'data room arquivos' },
  { id: 'score', label: 'Score', href: '/dashboard/scoring', icon: <BarChart3 className="h-4 w-4" />, keywords: 'rating pontuacao' },
  { id: 'cpr', label: 'CPR', sub: 'Cédula de Produto Rural', href: '/dashboard/cpr', icon: <ScrollText className="h-4 w-4" />, keywords: 'cedula assinatura' },
  { id: 'carbon', label: 'Crédito de Carbono', href: '/dashboard/carbon-credits', icon: <Leaf className="h-4 w-4" />, keywords: 'esg carbono co2' },
  { id: 'market', label: 'Mercado de Carbono', href: '/dashboard/carbon-credits/mercado', icon: <Leaf className="h-4 w-4" />, keywords: 'preco cotacao carbono' },
  { id: 'settings', label: 'Configurações', href: '/dashboard/settings', icon: <Settings className="h-4 w-4" />, keywords: 'perfil senha conta api' },
  { id: 'admin', label: 'Painel Admin', href: '/dashboard/admin', icon: <Users className="h-4 w-4" />, keywords: 'administracao' },
  { id: 'leads', label: 'Leads', href: '/dashboard/admin/leads', icon: <Landmark className="h-4 w-4" />, keywords: 'contatos simulador' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [ops, setOps] = useState<{ id: string; type: string; crop?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atalho ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      // carrega operações para busca (uma vez por abertura)
      api.get('/operations?page=1&perPage=50')
        .then((r) => setOps((r.data?.data || r.data || []).map((o: any) => ({ id: o.id, type: o.type, crop: o.crop }))))
        .catch(() => {});
    }
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const navMatches = NAV.filter(
      (c) => !term || c.label.toLowerCase().includes(term) || c.keywords?.includes(term),
    );
    const opMatches: Cmd[] =
      term.length >= 2
        ? ops
            .filter((o) => o.type?.toLowerCase().includes(term) || o.crop?.toLowerCase().includes(term) || o.id.includes(term))
            .slice(0, 6)
            .map((o) => ({
              id: 'op-' + o.id,
              label: `${o.type}${o.crop ? ' · ' + o.crop : ''}`,
              sub: `Operação #${o.id.slice(-6).toUpperCase()}`,
              href: `/dashboard/operations/${o.id}`,
              icon: <FileText className="h-4 w-4" />,
            }))
        : [];
    return [...navMatches, ...opMatches];
  }, [q, ops]);

  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border px-4">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) go(results[active].href);
            }}
            placeholder="Buscar páginas, operações…"
            className="flex-1 bg-transparent py-3.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
          />
          <kbd className="text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Nada encontrado.</p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(c.href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                  i === active ? 'bg-brand-50 dark:bg-brand-950/30' : ''
                }`}
              >
                <span className="text-gray-500 dark:text-gray-400">{c.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">{c.label}</span>
                  {c.sub && <span className="block text-xs text-gray-400 truncate">{c.sub}</span>}
                </span>
                {i === active && <ArrowRight className="h-4 w-4 text-brand-500" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
