'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { NavSection } from './DashboardShell';

interface Cmd {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  group: string;
}

export function CommandPalette({
  navSections,
  operationSearchEndpoint,
}: {
  navSections: NavSection[];
  operationSearchEndpoint: string;
}) {
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
    const openPalette = () => setOpen(true);
    window.addEventListener('conectcampo:open-command-palette', openPalette);
    return () => window.removeEventListener('conectcampo:open-command-palette', openPalette);
  }, []);

  useEffect(() => {
    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      // carrega operações para busca (uma vez por abertura)
      api.get(`${operationSearchEndpoint}?page=1&perPage=50`)
        .then((r) => setOps((r.data?.data || r.data || []).map((o: any) => ({ id: o.id, type: o.type, crop: o.crop }))))
        .catch(() => {});
      return () => { document.body.style.overflow = previousOverflow; };
    }
  }, [open, operationSearchEndpoint]);

  const navigation = useMemo<Cmd[]>(() => navSections.flatMap((section) =>
    section.items.map((item) => ({
      id: `${section.title}-${item.label}-${item.href}`,
      label: item.label,
      sub: section.title,
      href: item.href,
      icon: item.icon,
      group: 'Páginas',
    }))), [navSections]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const navMatches = navigation.filter(
      (c) => !term || `${c.label} ${c.sub ?? ''}`.toLowerCase().includes(term),
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
              group: 'Operações',
            }))
        : [];
    return [...navMatches, ...opMatches];
  }, [navigation, q, ops]);

  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-gray-950/55 px-4 pt-[12vh] backdrop-blur-[3px]" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Busca global">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-black/20 dark:border-gray-800 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 dark:border-dark-border">
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
            className="flex-1 bg-transparent py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
          />
          <kbd className="text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Nada encontrado.</p>
          ) : (
            results.map((c, i) => (
              <div key={c.id}>
                {(i === 0 || results[i - 1]?.group !== c.group) && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{c.group}</p>
                )}
                <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(c.href)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === active ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${i === active ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400' : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{c.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">{c.label}</span>
                  <span className="block text-xs text-gray-400 truncate">{c.group}{c.sub ? ` · ${c.sub}` : ''}</span>
                </span>
                {i === active && <ArrowRight className="h-4 w-4 text-brand-500" />}
              </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
