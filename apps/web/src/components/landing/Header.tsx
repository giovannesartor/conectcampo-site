'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const plataformaLinks = [
  { name: 'Ferramentas', href: '/#plataforma' },
  { name: 'Como Funciona', href: '/como-funciona' },
  { name: 'Planos', href: '/planos' },
  { name: 'Parceiros', href: '/parceiros' },
  { name: 'API para Devs', href: '/api-docs' },
];

const mobileNavLinks = [
  { name: 'Ferramentas', href: '/#plataforma' },
  { name: 'Como Funciona', href: '/como-funciona' },
  { name: 'Planos', href: '/planos' },
  { name: 'Parceiros', href: '/parceiros' },
  { name: 'API para Devs', href: '/api-docs' },
  { name: 'Sobre Nós', href: '/sobre' },
  { name: 'Contato', href: '/contato' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/80 bg-white/[0.92] shadow-[0_8px_30px_-28px_rgba(0,40,24,0.55)] backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/[0.92]">
      <nav aria-label="Navegação principal" className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-6 py-2 lg:px-8">
        {/* Logo */}
        <Logo size="md" href="/" />

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-6">
          {/* Plataforma dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropdownOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors py-2"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              aria-controls="platform-menu"
            >
              Plataforma <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 top-full pt-1">
              <div id="platform-menu" role="menu" className="w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-gray-950/10 dark:border-dark-border dark:bg-dark-card">
                {plataformaLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-900/20 dark:hover:text-brand-300"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              </div>
            )}
          </div>

          <Link href="/sobre" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
            Sobre Nós
          </Link>
          <Link href="/contato" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
            Contato
          </Link>
        </div>

        {/* CTA + theme toggle */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-3">
          <ThemeToggle />
          <Link href="/login" className="btn-ghost">
            Entrar
          </Link>
          <Link href="/register" className="btn-primary">
            Começar Agora
          </Link>
        </div>

        {/* Mobile: theme toggle + menu button */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-gray-200 bg-white/95 shadow-xl backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/95 lg:hidden">
          <div className="space-y-1 px-6 py-4">
            {mobileNavLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/login" className="btn-ghost w-full text-center">
                Entrar
              </Link>
              <Link href="/register" className="btn-primary w-full text-center">
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
