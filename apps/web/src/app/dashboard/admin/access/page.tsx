'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ErrorState } from '@/components/dashboard/PageKit';

interface Flows {
  apple?: { linkedAccounts: number; pendingRevocations: number };
  since: string;
  firstEventAt: string | null;
  providers: { id: string; name: string; available: boolean; detail: string }[];
  counts: { provider: string; operation: string; outcome: string; _count: number }[];
  recent: { id: string; provider: string; operation: string; outcome: string; code: string | null; createdAt: string }[];
  mail: { provider: string; configured: boolean; queueAvailable: boolean; counts: Record<string, number> | null };
}
const outcomes: Record<string, string> = { SUCCESS: 'Sucesso', FAILURE: 'Falha', ACCEPTED: 'Aceito pelo provedor' };
const operations: Record<string, string> = { LOGIN: 'Login', REGISTER: 'Cadastro', SEND: 'Envio de e-mail', LINK: 'Vinculação' };

export default function AccessFlowsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Flows | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setData((await api.get('/admin/auth-flows')).data); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (user?.role === 'ADMIN') void load(); }, [user?.role, load]);
  if (user?.role !== 'ADMIN') return null;
  if (error) return <ErrorState title="Monitoramento indisponível" onRetry={load} />;
  const count = (provider: string, operation: string, outcome: string) => data?.counts.find(c => c.provider === provider && c.operation === operation && c.outcome === outcome)?._count ?? 0;
  return (
    <div className="space-y-5">
      <Link href="/dashboard/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-brand-700 dark:text-brand-300"><ArrowLeft className="h-4 w-4" /> Administração</Link>
      <div className="dashboard-heading">
        <div><h1 className="text-2xl font-bold">Acessos e e-mails</h1><p className="mt-2 text-sm leading-6 text-gray-500">Configuração e eventos dos últimos 7 dias. Credenciais, tokens e conteúdo de mensagens nunca aparecem aqui.</p></div>
        <button type="button" onClick={load} disabled={loading} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar</button>
      </div>
      {!data ? <p role="status">Carregando fluxos…</p> : <>
        <div className="grid gap-4 lg:grid-cols-3">
          {data.providers.map(provider => <section className="card" key={provider.id}>
            <ShieldCheck className="mb-3 h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold">{provider.name}</h2>
            <p className={`mt-2 text-sm font-semibold ${provider.available ? 'text-brand-700 dark:text-brand-300' : 'text-amber-700 dark:text-amber-300'}`}>{provider.available ? 'Disponível' : 'Pendente de ativação'}</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">{provider.detail}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt>Logins com sucesso</dt><dd className="font-bold tabular-nums">{count(provider.id, 'LOGIN', 'SUCCESS')}</dd></div>
              <div className="flex justify-between gap-2"><dt>Falhas de login</dt><dd className="font-bold tabular-nums">{count(provider.id, 'LOGIN', 'FAILURE')}</dd></div>
              <div className="flex justify-between gap-2"><dt>Novos cadastros</dt><dd className="font-bold tabular-nums">{count(provider.id, 'REGISTER', 'SUCCESS')}</dd></div>
              <div className="flex justify-between gap-2"><dt>Cadastros recusados</dt><dd className="font-bold tabular-nums">{count(provider.id, 'REGISTER', 'FAILURE')}</dd></div>
              {provider.id === 'APPLE' && <>
                <div className="flex justify-between gap-2"><dt>Contas vinculadas</dt><dd className="font-bold tabular-nums">{data.apple?.linkedAccounts ?? 0}</dd></div>
                <div className="flex justify-between gap-2"><dt>Revogações pendentes</dt><dd className="font-bold tabular-nums">{data.apple?.pendingRevocations ?? 0}</dd></div>
              </>}
            </dl>
          </section>)}
        </div>
        <section className="card">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Mail className="h-5 w-5 text-brand-600" /> Entrega de e-mails</h2>
          <p className="mt-2 text-sm text-gray-500">{data.mail.provider} · {data.mail.configured ? 'Credenciais configuradas' : 'Credenciais pendentes'} · {data.mail.queueAvailable ? 'Fila acessível' : 'Fila indisponível'}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[['Aceitos pelo provedor', count('MAIL', 'SEND', 'ACCEPTED')], ['Tentativas com falha', count('MAIL', 'SEND', 'FAILURE')], ['Na fila', data.mail.counts ? (data.mail.counts.waiting ?? 0) + (data.mail.counts.delayed ?? 0) : '—'], ['Falhas na fila', data.mail.counts?.failed ?? '—']].map(([label, value]) => <div key={label}><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-gray-500">Aceito pelo provedor não confirma entrega na caixa de entrada. Tentativas de reenvio são contadas separadamente. Gmail como destinatário não é o mesmo que autenticação Google.</p>
        </section>
        <section className="card">
          <h2 className="text-lg font-bold">Eventos recentes</h2>
          <p className="mt-2 text-xs leading-5 text-gray-500">{data.firstEventAt ? `Histórico disponível a partir de ${new Date(data.firstEventAt).toLocaleString('pt-BR')}.` : 'O histórico começará com o primeiro evento após a ativação do monitoramento.'} Dados anteriores não foram reconstruídos. Validações recusadas antes do processamento e bloqueios por limite de tentativas não entram nesses contadores.</p>
          <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {data.recent.map(event => <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-semibold">{event.provider === 'MAIL' ? 'E-mail transacional' : event.provider} · {operations[event.operation] ?? event.operation}</p><p className="mt-1 text-xs text-gray-500">{new Date(event.createdAt).toLocaleString('pt-BR')}</p></div><span className={event.outcome === 'FAILURE' ? 'text-red-600' : 'text-brand-700 dark:text-brand-300'}>{outcomes[event.outcome] ?? event.outcome}</span></li>)}
            {data.recent.length === 0 && <li className="py-4 text-sm text-gray-500">Nenhum evento registrado ainda.</li>}
          </ul>
        </section>
      </>}
    </div>
  );
}
