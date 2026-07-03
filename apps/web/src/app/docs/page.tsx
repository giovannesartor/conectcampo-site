'use client';

import { useEffect, useState } from 'react';

/**
 * Documentação interativa da API (Scalar API Reference) carregada no domínio do
 * site. Consome a especificação OpenAPI servida em /docs-json.
 */
export default function DocsPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    // Elemento de configuração lido pelo script do Scalar.
    const holder = document.createElement('script');
    holder.id = 'api-reference';
    holder.setAttribute('data-url', '/api/v1/openapi.json');
    document.body.appendChild(holder);

    const cdn = document.createElement('script');
    cdn.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';
    cdn.async = true;
    cdn.onload = () => setStatus('ready');
    cdn.onerror = () => setStatus('error');
    document.body.appendChild(cdn);

    return () => {
      holder.remove();
      cdn.remove();
    };
  }, []);

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white p-8 text-center dark:bg-gray-950">
        <h1 className="text-2xl font-bold">Não foi possível carregar a documentação interativa</h1>
        <p className="text-gray-500 max-w-md">
          Você ainda pode acessar a especificação OpenAPI diretamente ou voltar para a página de guia da API.
        </p>
        <div className="flex gap-3">
          <a href="/api/v1/openapi.json" className="btn-primary">Abrir OpenAPI (JSON)</a>
          <a href="/api-docs" className="btn-ghost">Guia da API</a>
        </div>
      </div>
    );
  }

  // Overlay de carregamento: cobre a tela inteira e some assim que o Scalar renderiza.
  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white text-gray-400 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Carregando documentação da API…
        </div>
      </div>
    );
  }

  // Quando pronto, o Scalar já injetou sua própria UI no documento.
  return null;
}
