import { PublicLayout } from '@/components/landing/PublicLayout';
import { Code2, Key, Zap, Shield, BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const endpoints = [
  { method: 'POST', path: '/auth/register', description: 'Criação de conta de usuário' },
  { method: 'POST', path: '/auth/login', description: 'Autenticação e retorno de JWT' },
  { method: 'GET', path: '/producers/me', description: 'Perfil do produtor autenticado' },
  { method: 'POST', path: '/operations', description: 'Criação de operação de crédito' },
  { method: 'GET', path: '/operations', description: 'Listagem de operações' },
  { method: 'GET', path: '/scoring/:id', description: 'Score ConectCampo de um produtor' },
  { method: 'GET', path: '/matching/:operationId', description: 'Matches para uma operação' },
  { method: 'POST', path: '/documents/upload', description: 'Upload de documentos (multipart)' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  POST: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function ApiDocsPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-24 lg:px-8 text-center">
        <span className="inline-block rounded-full bg-brand-900/50 px-4 py-1.5 text-sm font-medium text-brand-400 mb-6">
          Documentação da API
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Integre o crédito rural{' '}
          <span className="text-brand-400">no seu sistema</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          A API RESTful da ConectCampo permite integrar scoring, matching e gestão de operações de crédito
          diretamente nos seus sistemas institucional ou de campo.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contato" className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors">
            Solicitar acesso à API <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: 'RESTful & JSON', desc: 'Padrão REST com respostas JSON. Fácil de integrar com qualquer stack.' },
            { icon: Key, title: 'JWT Auth', desc: 'Autenticação segura via JWT com refresh tokens.' },
            { icon: Shield, title: 'HTTPS + TLS', desc: 'Toda comunicação criptografada. Conformidade com LGPD.' },
            { icon: Code2, title: 'Sandbox gratuito', desc: 'Ambiente de testes completo para desenvolvimento.' },
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

      {/* Base URL */}
      <section className="px-6 pb-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">URL Base</h2>
          <div className="rounded-xl bg-gray-900 p-4">
            <code className="text-sm text-green-400">
              https://api.conectcampo.com.br/v1
            </code>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Endpoints principais</h2>
          <div className="rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
            {endpoints.map((ep, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i !== endpoints.length - 1 ? 'border-b border-gray-100 dark:border-dark-border' : ''
                } bg-white dark:bg-dark-card`}
              >
                <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-xs font-bold font-mono ${methodColors[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="text-sm text-gray-800 dark:text-gray-200 font-mono flex-1">
                  {ep.path}
                </code>
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{ep.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth example */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand-600" /> Exemplo de autenticação
          </h2>
          <div className="rounded-xl bg-gray-900 p-6 overflow-x-auto">
            <pre className="text-sm text-gray-300 leading-relaxed">{`curl -X POST https://api.conectcampo.com.br/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "joao@agro.com",
    "password": "SuaSenha@123"
  }'

# Resposta:
{
  "user": { "id": "...", "email": "joao@agro.com", "role": "PRODUCER" },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}`}</pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center rounded-2xl bg-brand-50 dark:bg-dark-card border border-brand-100 dark:border-dark-border p-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Precisa de acesso completo à API?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Entre em contato com nosso time para receber suas credenciais de produção e documentação completa.
          </p>
          <Link href="/contato" className="btn-primary inline-flex items-center gap-2">
            Solicitar credenciais <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
