import Link from 'next/link';
import { Sprout } from 'lucide-react';

const footerLinks = {
  Plataforma: [
    { name: 'Como Funciona', href: '#como-funciona' },
    { name: 'Planos', href: '#planos' },
    { name: 'Parceiros', href: '#' },
    { name: 'API', href: '#' },
  ],
  Legal: [
    { name: 'Termos de Uso', href: '#' },
    { name: 'Política de Privacidade', href: '#' },
    { name: 'LGPD', href: '#' },
    { name: 'Compliance', href: '#' },
  ],
  Empresa: [
    { name: 'Sobre Nós', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Carreiras', href: '#' },
    { name: 'Contato', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                <Sprout className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Conect<span className="text-brand-600">Campo</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Marketplace de crédito agro que conecta produtores rurais
              às melhores oportunidades de financiamento.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {category}
              </h4>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-200 dark:border-dark-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ConectCampo. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-400">
            ConectCampo não é uma instituição financeira. Atuamos como marketplace conectando oferta e demanda de crédito.
          </p>
        </div>
      </div>
    </footer>
  );
}
