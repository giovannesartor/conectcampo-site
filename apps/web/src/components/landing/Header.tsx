'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Sprout } from 'lucide-react';

const navigation = [
  { name: 'Como Funciona', href: '#como-funciona' },
  { name: 'Segmentação', href: '#segmentacao' },
  { name: 'Segurança', href: '#seguranca' },
  { name: 'Planos', href: '#planos' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl border-b border-gray-200 dark:border-dark-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Conect<span className="text-brand-600">Campo</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
          <Link href="/login" className="btn-ghost">
            Entrar
          </Link>
          <Link href="/register" className="btn-primary">
            Começar Agora
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-dark-border">
          <div className="space-y-1 px-6 py-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-card"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
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
