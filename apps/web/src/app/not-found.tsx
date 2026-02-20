import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg px-6">
      <div className="max-w-md text-center">
        <div className="text-8xl font-black text-brand-600/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Página não encontrada
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="h-4 w-4" />
            Voltar ao início
          </Link>
          <Link href="/contato" className="btn-ghost flex items-center justify-center gap-2">
            <Search className="h-4 w-4" />
            Falar com suporte
          </Link>
        </div>
      </div>
    </div>
  );
}
