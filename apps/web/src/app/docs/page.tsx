'use client';

import { useEffect, useState } from 'react';

/**
 * Documentação interativa da API (Scalar API Reference) carregada no domínio do
 * site. Consome a especificação OpenAPI servida em /docs-json.
 */
export default function DocsPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Elemento de configuração lido pelo script do Scalar.
    const holder = document.createElement('script');
    holder.id = 'api-reference';
    holder.setAttribute('data-url', '/docs-json');
    document.body.appendChild(holder);

    const cdn = document.createElement('script');
    cdn.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';
    cdn.async = true;
    cdn.onerror = () => setFailed(true);
    document.body.appendChild(cdn);

    return () => {
      holder.remove();
      cdn.remove();
    };
  }, []);

  if (failed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Não foi possível carregar a documentação interativa</h1>
        <p className="text-gray-500 max-w-md">
          Você ainda pode acessar a especificação OpenAPI diretamente ou voltar para a página de guia da API.
        </p>
        <div className="flex gap-3">
          <a href="/docs-json" className="btn-primary">Abrir OpenAPI (JSON)</a>
          <a href="/api-docs" className="btn-ghost">Guia da API</a>
        </div>
      </div>
    );
  }

  // O Scalar injeta sua própria UI no documento; mantemos apenas um placeholder.
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Carregando documentação da API…
    </div>
  );
}
