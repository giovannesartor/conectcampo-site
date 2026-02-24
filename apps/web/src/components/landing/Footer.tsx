import Link from 'next/link';
import { Logo } from '@/components/Logo';

const footerLinks = {
  Plataforma: [
    { name: 'Como Funciona', href: '/como-funciona' },
    { name: 'Planos', href: '/planos' },
    { name: 'Parceiros', href: '/parceiros' },
    { name: 'API', href: '/api-docs' },
  ],
  Legal: [
    { name: 'Termos de Uso', href: '/legal/termos-de-uso' },
    { name: 'Política de Privacidade', href: '/legal/privacidade' },
    { name: 'LGPD', href: '/legal/lgpd' },
    { name: 'Compliance', href: '/legal/compliance' },
  ],
  Empresa: [
    { name: 'Sobre Nós', href: '/sobre' },
    { name: 'Blog', href: '/blog' },
    { name: 'Carreiras', href: '/carreiras' },
    { name: 'Contato', href: '/contato' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Logo size="md" href="/" />
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

        {/* AG Digital legal notice */}
        <div className="mt-4 border-t border-gray-100 dark:border-dark-border pt-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            ConectCampo é um produto{' '}
            <span className="font-semibold text-gray-500 dark:text-gray-400">AG Digital</span>
            {' '}· AG PARTICIPACOES SOCIETARIAS LTDA · CNPJ 54.079.299/0001-40
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Pagamentos processados por AG Digital via Asaas
          </p>
        </div>
      </div>
    </footer>
  );
}
