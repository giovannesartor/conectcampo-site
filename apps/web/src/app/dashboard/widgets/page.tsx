'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CloudSun, ExternalLink, LayoutGrid, RefreshCw, ShieldCheck, Sprout } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { hasWidgetCoordinates, readWidgetPreferences, saveWidgetPreferences, supportsNativeWidgets, syncNativeWidgets, type WidgetContext, type WidgetFarm, type WidgetPreferences } from '@/lib/native-widgets';

export default function WidgetsPage() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(false);
  const [farms, setFarms] = useState<WidgetFarm[]>([]);
  const [preferences, setPreferences] = useState<WidgetPreferences>({ agendaEnabled: false, farmId: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    let disposed = false;
    setAvailable(supportsNativeWidgets());
    setPreferences(readWidgetPreferences(user.id));
    setLoading(true);
    setError('');
    void api.get<WidgetContext>('/widgets/context').then(({ data }) => {
      if (!disposed) setFarms(data.farms);
    }).catch(() => { if (!disposed) setError('Não foi possível carregar suas propriedades. Verifique a conexão e tente novamente.'); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [user?.id]);

  async function save() {
    if (!user || !available || saving) return;
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await saveWidgetPreferences(user.id, preferences);
      const synced = await syncNativeWidgets(user.id, true);
      if (synced) setStatus('Preferências salvas e dados enviados ao widget. O iOS controla quando a tela será atualizada.');
      else setError('A sessão mudou. Abra novamente esta tela para sincronizar.');
    } catch {
      setError('Não foi possível concluir a sincronização. Confira sua conexão e tente novamente antes de sair do aplicativo.');
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300"><LayoutGrid className="h-4 w-4" /> ConectCampo no seu iPhone</p>
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">Seu campo, de relance</h1>
        <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">Cotações, clima e agenda na tela de início, sem precisar abrir o aplicativo. Escolha abaixo o que deseja compartilhar com seus widgets.</p>
      </header>

      {!available && <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-200">Esta configuração funciona no aplicativo ConectCampo para iPhone, em uma versão com os widgets instalados e iOS 16 ou superior. No navegador ou em versões anteriores, você pode conhecer os recursos aqui, mas não ativá-los.</div>}

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Widgets disponíveis">
        <article className="card !p-5"><Sprout className="h-6 w-6 text-brand-600" /><h2 className="mt-4 font-bold">Cotações agrícolas</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Soja e milho por saca de 60 kg. Média estadual do Paraná, com fonte e data do boletim DERAL/SEAB-PR.</p><p className="mt-3 text-xs leading-5 text-gray-500">Referência de compra no atacado, não oferta garantida nem cotação nacional. Sem dados simulados.</p><Link href="/dashboard/quotes" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 dark:text-brand-300">Abrir cotações →</Link></article>
        <article className="card !p-5"><CloudSun className="h-6 w-6 text-brand-600" /><h2 className="mt-4 font-bold">Clima da propriedade</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Temperatura, mínima, máxima e chance de chuva para a localização da propriedade que você escolher.</p><p className="mt-3 text-xs leading-5 text-gray-500">Previsão fornecida pelo Apple Weather. Não substitui orientações técnicas ou alertas oficiais.</p><a href="https://weatherkit.apple.com/legal-attribution.html" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">Fontes do Apple Weather <ExternalLink className="h-3 w-3" /></a></article>
        <article className="card !p-5"><CalendarDays className="h-6 w-6 text-brand-600" /><h2 className="mt-4 font-bold">Agenda rural</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Quantidade de vencimentos pendentes de hoje e a próxima data na sua agenda financeira.</p><p className="mt-3 text-xs leading-5 text-gray-500">Sem valores, nomes de clientes, títulos de eventos ou documentos. Somente dados da sua conta.</p><Link href="/dashboard/calendar" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 dark:text-brand-300">Abrir minha agenda →</Link></article>
      </section>

      <section className="card space-y-5" aria-labelledby="widget-settings">
        <div><h2 id="widget-settings" className="text-lg font-bold">Personalizar neste aparelho</h2><p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">Clima e agenda começam desativados. Cotações públicas não precisam acessar sua conta.</p></div>
        <div>
          <label className="label" htmlFor="widget-farm">Propriedade para a previsão do tempo</label>
          <select id="widget-farm" className="input" value={preferences.farmId ?? ''} disabled={!available || loading || saving} onChange={event => { setPreferences(previous => ({ ...previous, farmId: event.target.value || null })); setStatus(''); }}>
            <option value="">Não compartilhar localização</option>
            {farms.filter(hasWidgetCoordinates).map(farm => <option key={farm.id} value={farm.id}>{farm.name} · {farm.city}/{farm.state}</option>)}
          </select>
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Ao ativar, as coordenadas cadastradas dessa propriedade serão usadas pelo Apple Weather. O widget mostra apenas município/UF, não o nome da propriedade. Não usamos a localização atual do iPhone.</p>
          {!loading && !farms.some(hasWidgetCoordinates) && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Nenhuma propriedade com coordenadas cadastradas. <Link href="/dashboard/farms" className="font-semibold text-brand-700 underline dark:text-brand-300">Cadastrar ou editar propriedade</Link>.</p>}
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-green-700" checked={preferences.agendaEnabled} disabled={!available || saving} onChange={event => { setPreferences(previous => ({ ...previous, agendaEnabled: event.target.checked })); setStatus(''); }} />
          <span><span className="block text-sm font-semibold">Mostrar resumo da minha agenda</span><span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">Autorizo exibir datas e quantidades de vencimentos na tela de início. Outras pessoas que usam este aparelho poderão ver esse resumo.</span></span>
        </label>
        <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={!available || loading || saving} onClick={() => void save()} className="btn-primary inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />{saving ? 'Sincronizando…' : 'Salvar e sincronizar'}</button><span className="text-xs text-gray-500">Preferências separadas por conta e aparelho.</span></div>
        {error && <p role="alert" className="text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>}
        {status && <p role="status" className="text-sm leading-6 text-brand-700 dark:text-brand-300">{status}</p>}
      </section>

      <section className="card" aria-labelledby="widget-howto"><h2 id="widget-howto" className="text-lg font-bold">Como adicionar à tela de início</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-400"><li><strong className="text-gray-900 dark:text-gray-100">1.</strong> No iPhone, toque e segure uma área vazia da tela de início.</li><li><strong className="text-gray-900 dark:text-gray-100">2.</strong> Toque em Editar → Adicionar Widget (ou no botão +, conforme a versão do iOS).</li><li><strong className="text-gray-900 dark:text-gray-100">3.</strong> Procure ConectCampo, escolha Cotações, Clima ou Agenda e o tamanho desejado.</li><li><strong className="text-gray-900 dark:text-gray-100">4.</strong> Toque em Adicionar Widget. Repita para os outros. Um toque no widget abre a área correspondente do app.</li></ol></section>

      <aside className="flex items-start gap-3 rounded-2xl bg-gray-100 p-5 dark:bg-gray-800/60"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-600" /><div className="space-y-2 text-xs leading-6 text-gray-600 dark:text-gray-400"><p>O iOS decide a frequência de atualização: os widgets não são em tempo real. Cotações respeitam a data de publicação da fonte; em fins de semana e feriados, o último boletim pode continuar sendo exibido.</p><p>Abra o app para atualizar a agenda e suas preferências. O resumo da agenda expira após 12 horas sem sincronização. Ao sair da conta, solicitamos a remoção dos dados pessoais do widget; a atualização visual depende do iOS.</p><p>Estes widgets são para a tela de início. Não exibimos informações financeiras detalhadas nem prometemos alertas de vencimento por meio deles.</p></div></aside>
    </div>
  );
}
