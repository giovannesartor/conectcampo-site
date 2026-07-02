'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Satellite, CloudSun, ShieldAlert, DollarSign, Store,
  Wallet, CalendarClock, Leaf, ScrollText, FileScan, NotebookPen,
  ArrowRight, ShieldCheck,
} from 'lucide-react';

const TOOLS = [
  { icon: MapPin, title: 'Gestão de Áreas', desc: 'Fazendas e talhões com CAR, cultura e safra — base para tudo.' },
  { icon: Satellite, title: 'Satélite (NDVI)', desc: 'Saúde da lavoura por imagens de satélite, talhão a talhão.', badge: 'Novo' },
  { icon: CloudSun, title: 'Clima & Alertas', desc: 'Previsão de 7 dias, geada, seca e janela ideal de plantio.' },
  { icon: ShieldAlert, title: 'Risco de Safra', desc: 'Score climático que cruza clima e NDVI por talhão.' },
  { icon: DollarSign, title: 'Cotações & Preços', desc: 'Soja, milho, boi e dólar (CEPEA/B3) direto no painel.' },
  { icon: Store, title: 'Marketplace de Grãos', desc: 'Compre e venda com pagamento seguro em custódia.', badge: 'Novo', highlight: true },
  { icon: Wallet, title: 'Fluxo de Caixa', desc: 'Receitas × despesas por safra, com projeção e gráficos.' },
  { icon: CalendarClock, title: 'Calendário', desc: 'Parcelas, CPRs e seguros num só lugar, com lembretes.' },
  { icon: Leaf, title: 'Crédito de Carbono', desc: 'Projetos de carbono e acesso ao mercado voluntário.' },
  { icon: ScrollText, title: 'CPR Digital', desc: 'Emita e assine Cédulas de Produto Rural eletronicamente.' },
  { icon: FileScan, title: 'Docs Inteligentes', desc: 'Extração automática de matrícula, CAR, notas e contratos.' },
  { icon: NotebookPen, title: 'Diário de Safra', desc: 'Caderno de campo: plantio, insumos e rastreabilidade.' },
];

export function Platform() {
  return (
    <section id="plataforma" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 mesh-glow opacity-60" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            Plataforma completa
          </span>
          <h2 className="section-title mt-3">Muito além do crédito</h2>
          <p className="section-subtitle">
            O ConectCampo virou o sistema operacional do produtor: da gestão da fazenda ao
            monitoramento por satélite, da comercialização ao crédito de carbono — tudo integrado.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
              className={`card card-hover group relative flex gap-4 ${
                t.highlight ? 'ring-1 ring-brand-500/30 bg-gradient-to-br from-brand-50/60 to-transparent dark:from-brand-950/20' : ''
              }`}
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 transition-transform group-hover:-translate-y-0.5">
                <t.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{t.title}</h3>
                  {t.badge && (
                    <span className="rounded-full bg-agro-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-agro-gold">
                      {t.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Faixa de destaque — pagamento seguro */}
        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30 p-6 text-center sm:flex-row sm:text-left">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white">Marketplace com pagamento seguro em custódia</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              O comprador paga, o ConectCampo retém e só libera ao vendedor após a confirmação da entrega.
              Taxa de apenas 1% por venda (0,5% de cada parte), via ValsaPay.
            </p>
          </div>
          <Link href="/register" className="btn-primary flex-shrink-0">
            Começar agora <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
