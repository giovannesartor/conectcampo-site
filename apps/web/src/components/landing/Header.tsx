'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const plataformaLinks = [
  { name: 'Como Funciona', href: '/como-funciona' },
  { name: 'Planos', href: '/planos' },
  { name: 'Parceiros', href: '/parceiros' },
  { name: 'API', href: '/api-docs' },
];

const mobileNavLinks = [
  { name: 'Como Funciona', href: '/como-funciona' },
  { name: 'Planos', href: '/planos' },
  { name: 'Parceiros', href: '/parceiros' },
  { name: 'API', href: '/api-docs' },
  { name: 'Sobre Nós', href: '/sobre' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contato', href: '/contato' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl border-b border-gray-200 dark:border-dark-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
        {/* Logo */}
        <Logo size="md" href="/" />

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-6">
          {/* Plataforma dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors py-2">
              Plataforma <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 top-full pt-1">
              <div className="w-48 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-lg overflow-hidden">
                {plataformaLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-colors"
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
          <Link href="/blog" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
            Blog
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
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-dark-border">
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
