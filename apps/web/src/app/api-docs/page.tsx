import { PublicLayout } from '@/components/landing/PublicLayout';
import {
  Code2, Key, Zap, Shield, BookOpen, ArrowRight, Terminal,
  Boxes, AlertTriangle, Gauge, FileJson, ExternalLink, Rocket, ListChecks,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'API para desenvolvedores | ConectCampo',
  description:
    'API REST da ConectCampo: autenticação por API Key ou JWT, documentação interativa (Swagger/OpenAPI), scoring, monitoramento por satélite, marketplace e cotações.',
};

const API_BASE = 'https://conectcampo.digital/api/v1';
const SWAGGER_URL = '/docs';
const OPENAPI_URL = '/docs-json';

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const endpointGroups: { group: string; icon: typeof Boxes; endpoints: { method: string; path: string; description: string }[] }[] = [
  {
    group: 'Autenticação',
    icon: Key,
    endpoints: [
      { method: 'POST', path: '/auth/register', description: 'Cria uma conta de usuário' },
      { method: 'POST', path: '/auth/login', description: 'Autentica e retorna JWT + refresh token' },
      { method: 'POST', path: '/auth/refresh', description: 'Renova o access token' },
      { method: 'GET', path: '/auth/me', description: 'Dados do usuário autenticado' },
    ],
  },
  {
    group: 'Chaves de API',
    icon: Shield,
    endpoints: [
      { method: 'GET', path: '/api-keys', description: 'Lista suas chaves' },
      { method: 'POST', path: '/api-keys', description: 'Cria uma nova chave (segredo exibido só uma vez)' },
      { method: 'DELETE', path: '/api-keys/:id', description: 'Revoga uma chave' },
    ],
  },
  {
    group: 'Fazendas & Talhões',
    icon: Boxes,
    endpoints: [
      { method: 'GET', path: '/farms', description: 'Lista fazendas com talhões e geometria' },
      { method: 'POST', path: '/farms', description: 'Cadastra uma fazenda' },
      { method: 'GET', path: '/farms/summary', description: 'Resumo consolidado de áreas e culturas' },
      { method: 'POST', path: '/farms/:id/plots', description: 'Adiciona um talhão (com coordenada/contorno)' },
      { method: 'DELETE', path: '/farms/plots/:id', description: 'Remove um talhão' },
    ],
  },
  {
    group: 'Monitoramento por satélite',
    icon: Zap,
    endpoints: [
      { method: 'POST', path: '/ndvi/plots/:plotId/generate', description: 'Gera/atualiza série NDVI do talhão' },
      { method: 'GET', path: '/ndvi/plots/:plotId', description: 'Série temporal de NDVI' },
      { method: 'GET', path: '/weather/forecast', description: 'Previsão do tempo por localização' },
      { method: 'GET', path: '/climate-score/:farmId', description: 'Score climático da propriedade' },
    ],
  },
  {
    group: 'Crédito, Score & Match',
    icon: Gauge,
    endpoints: [
      { method: 'GET', path: '/operations', description: 'Lista operações de crédito' },
      { method: 'POST', path: '/operations', description: 'Cria uma operação de crédito' },
      { method: 'GET', path: '/scoring/:id', description: 'Score ConectCampo do produtor' },
      { method: 'GET', path: '/matching/:operationId', description: 'Parceiros compatíveis com a operação' },
      { method: 'GET', path: '/cpr', description: 'Lista Cédulas de Produto Rural (CPR)' },
    ],
  },
  {
    group: 'Mercado & Financeiro',
    icon: ListChecks,
    endpoints: [
      { method: 'GET', path: '/marketplace/listings', description: 'Anúncios de insumos e grãos' },
      { method: 'POST', path: '/marketplace/orders', description: 'Cria pedido com escrow' },
      { method: 'GET', path: '/quotes', description: 'Cotações de commodities e câmbio' },
      { method: 'POST', path: '/quotes/alerts', description: 'Cria alerta de preço' },
      { method: 'GET', path: '/cashflow', description: 'Fluxo de caixa consolidado' },
    ],
  },
  {
    group: 'Documentos & ESG',
    icon: FileJson,
    endpoints: [
      { method: 'POST', path: '/documents/upload', description: 'Upload de documentos (multipart)' },
      { method: 'POST', path: '/smart-docs/extract', description: 'Extração inteligente de dados de documentos' },
      { method: 'GET', path: '/carbon-credits', description: 'Créditos de carbono e projetos ESG' },
    ],
  },
];

const errorCodes = [
  { code: '400', name: 'Bad Request', desc: 'Payload inválido ou parâmetros faltando' },
  { code: '401', name: 'Unauthorized', desc: 'API Key/JWT ausente ou inválido' },
  { code: '403', name: 'Forbidden', desc: 'Sem permissão para o recurso' },
  { code: '404', name: 'Not Found', desc: 'Recurso não encontrado' },
  { code: '409', name: 'Conflict', desc: 'Conflito de estado (ex.: duplicidade)' },
  { code: '429', name: 'Too Many Requests', desc: 'Rate limit de 60 req/min excedido' },
  { code: '500', name: 'Server Error', desc: 'Erro interno — tente novamente' },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="rounded-xl bg-gray-900 p-5 overflow-x-auto">
      <pre className="text-sm text-gray-300 leading-relaxed">{children}</pre>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Boxes; children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
      <Icon className="h-5 w-5 text-brand-600" /> {children}
    </h2>
  );
}

export default function ApiDocsPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-24 lg:px-8 text-center">
        <span className="inline-block rounded-full bg-brand-900/50 px-4 py-1.5 text-sm font-medium text-brand-400 mb-6">
          API para desenvolvedores
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Integre o agro brasileiro{' '}
          <span className="text-brand-400">na sua stack</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          Uma API REST completa para crédito rural, monitoramento de safra por satélite, marketplace,
          cotações e ESG. Autentique com API Key, teste na documentação interativa e vá para produção.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={SWAGGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
          >
            <BookOpen className="h-4 w-4" /> Documentação interativa
          </a>
          <Link
            href="/dashboard/settings?tab=apikeys"
            className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-colors"
          >
            <Key className="h-4 w-4" /> Gerar chave de API
          </Link>
          <a
            href={OPENAPI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-300 font-semibold px-6 py-3 rounded-lg hover:text-white transition-colors"
          >
            <FileJson className="h-4 w-4" /> OpenAPI (JSON)
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: 'RESTful & JSON', desc: 'Padrão REST previsível com respostas JSON. Integra com qualquer stack.' },
            { icon: Key, title: 'API Key ou JWT', desc: 'X-API-Key para servidor-a-servidor; JWT para apps de usuário.' },
            { icon: Shield, title: 'HTTPS + LGPD', desc: 'Toda comunicação criptografada (TLS) e conforme a LGPD.' },
            { icon: Gauge, title: 'Rate limit justo', desc: '60 req/min por chave, com erro 429 claro e revogação instantânea.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20 mb-4">
                <Icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quickstart */}
      <section className="px-6 pb-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionTitle icon={Rocket}>Comece em 3 passos</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { n: '1', t: 'Gere sua chave', d: 'No painel, vá em Configurações → Chaves de API e crie uma chave. Copie o segredo (ck_live_…) — ele só aparece uma vez.' },
              { n: '2', t: 'Autentique', d: 'Envie o header X-API-Key em cada requisição. Sem expiração, revogável a qualquer momento.' },
              { n: '3', t: 'Faça a 1ª chamada', d: 'Consuma qualquer endpoint da API. Teste tudo na documentação interativa antes de ir a produção.' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white font-bold mb-3">{s.n}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{s.t}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Base URL + recursos */}
      <section className="px-6 pb-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">URL base</h2>
            <div className="rounded-xl bg-gray-900 p-4">
              <code className="text-sm text-green-400">{API_BASE}</code>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <a href={SWAGGER_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 hover:border-brand-400">
              Swagger interativo <ExternalLink className="h-4 w-4 text-brand-600" />
            </a>
            <a href={OPENAPI_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between gap-2 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 hover:border-brand-400">
              Especificação OpenAPI <FileJson className="h-4 w-4 text-brand-600" />
            </a>
          </div>
        </div>
      </section>

      {/* Autenticação */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionTitle icon={Key}>Autenticação</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">API Key (integrações)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Recomendado para servidor-a-servidor. Envie o header <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">X-API-Key</code> em toda requisição.
                Cada chave tem <strong>scopes</strong> (<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">read</code>/<code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">write</code>) e pode ter expiração. Chaves só de leitura não executam POST/PATCH/DELETE.
              </p>
              <CodeBlock>{`curl ${API_BASE}/farms \\
  -H "X-API-Key: ck_live_xxxxxxxxxxxxxxxx"`}</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bearer JWT (apps)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Obtenha o token em <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">/auth/login</code> e envie no header <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">Authorization</code>.
              </p>
              <CodeBlock>{`curl ${API_BASE}/farms \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."`}</CodeBlock>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionTitle icon={Boxes}>Endpoints</SectionTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-3 mb-6">
            Principais recursos abaixo. A lista completa e testável está na{' '}
            <a href={SWAGGER_URL} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">documentação interativa</a>.
          </p>
          <div className="space-y-8">
            {endpointGroups.map(({ group, icon: Icon, endpoints }) => (
              <div key={group}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-brand-600" /> {group}
                </h3>
                <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
                  {endpoints.map((ep, i) => (
                    <div
                      key={ep.method + ep.path}
                      className={`flex items-center gap-4 px-5 py-3.5 ${i !== endpoints.length - 1 ? 'border-b border-gray-100 dark:border-dark-border' : ''} bg-white dark:bg-dark-card`}
                    >
                      <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-xs font-bold font-mono ${methodColors[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm text-gray-800 dark:text-gray-200 font-mono flex-1">{ep.path}</code>
                      <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{ep.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exemplos de código */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionTitle icon={Terminal}>Exemplos por linguagem</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">cURL</h3>
              <CodeBlock>{`curl ${API_BASE}/quotes \\
  -H "X-API-Key: $CONECTCAMPO_KEY"`}</CodeBlock>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">JavaScript (fetch)</h3>
              <CodeBlock>{`const res = await fetch(
  "${API_BASE}/quotes",
  { headers: { "X-API-Key": process.env.CONECTCAMPO_KEY } }
);
const data = await res.json();`}</CodeBlock>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Python (requests)</h3>
              <CodeBlock>{`import os, requests

r = requests.get(
    "${API_BASE}/quotes",
    headers={"X-API-Key": os.environ["CONECTCAMPO_KEY"]},
)
data = r.json()`}</CodeBlock>
            </div>
          </div>
        </div>
      </section>

      {/* Erros + Rate limit */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle icon={AlertTriangle}>Erros</SectionTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-3 mb-4">
              Erros retornam JSON no formato <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{ statusCode, message, error }'}</code>.
            </p>
            <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
              {errorCodes.map((e, i) => (
                <div key={e.code} className={`flex items-center gap-4 px-5 py-3 ${i !== errorCodes.length - 1 ? 'border-b border-gray-100 dark:border-dark-border' : ''} bg-white dark:bg-dark-card`}>
                  <span className="shrink-0 font-mono text-sm font-bold text-gray-900 dark:text-white w-10">{e.code}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 w-40">{e.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block flex-1">{e.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle icon={Gauge}>Rate limit & paginação</SectionTitle>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2"><Zap className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" /> Limite padrão de <strong className="text-gray-900 dark:text-white">60 requisições/minuto</strong> por chave (ou por IP, sem chave).</li>
              <li className="flex gap-2"><Gauge className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" /> Cada resposta traz <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">X-RateLimit-Limit/Remaining/Reset</code>.</li>
              <li className="flex gap-2"><AlertTriangle className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" /> Ao exceder, a API responde <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">429 Too Many Requests</code> com <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">Retry-After</code>.</li>
              <li className="flex gap-2"><Code2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" /> Toda resposta inclui <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">X-Request-Id</code> para correlação/suporte.</li>
              <li className="flex gap-2"><Code2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" /> Listagens aceitam <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">?page</code> e <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">?perPage</code>, retornando <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{ data, meta }'}</code>.</li>
              <li className="flex gap-2"><Shield className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" /> Revogue chaves comprometidas a qualquer momento no painel.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center rounded-2xl bg-brand-50 dark:bg-dark-card border border-brand-100 dark:border-dark-border p-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pronto para integrar?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Gere sua chave de API no painel e explore todos os endpoints na documentação interativa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/settings?tab=apikeys" className="btn-primary inline-flex items-center gap-2">
              Gerar chave de API <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={SWAGGER_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
              Abrir Swagger <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
