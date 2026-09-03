import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Download,
  FileSignature,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';

const steps = [
  {
    icon: ListChecks,
    index: '01',
    title: 'Estruture os dados',
    description: 'Partes, produto, valor de face, cronograma, garantias, avalistas e informações de registro em um fluxo guiado.',
  },
  {
    icon: Download,
    index: '02',
    title: 'Revise a minuta e o PDF',
    description: 'Quadro-resumo, conferência financeira, garantias detalhadas e 35 cláusulas no mesmo documento, com pendências sinalizadas.',
  },
  {
    icon: FileSignature,
    index: '03',
    title: 'Assine e acompanhe',
    description: 'Links individuais para emitente, credor e avalistas, autenticação por token e trilha de auditoria até o arquivo final assinado.',
  },
];

export function CprShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-emerald-100 bg-[#f6faf7] py-24 dark:border-emerald-950 dark:bg-[#07130d]">
      <div className="absolute inset-0 contour-pattern opacity-[0.025] dark:opacity-[0.045]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <BadgeCheck className="h-4 w-4" /> CPR profissional
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
            Da minuta ao acompanhamento, sem perder o controle do título.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300">
            A área de CPR transforma os dados de cada operação em uma minuta completa, PDF profissional e fluxo de assinatura com todas as partes. O padrão cobre produção, armazenamento, garantias, cronograma e registro, sem substituir a análise jurídica nem o comprovante oficial da registradora.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">0,8%</p>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">custo de emissão da CPR Financeira sobre o valor de face</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-300">35 cláusulas</p>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">conteúdo completo e personalizado conforme cada operação</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary inline-flex items-center gap-2">
              Criar minha CPR <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/como-funciona" className="btn-secondary inline-flex items-center gap-2">
              Entender o fluxo
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-200/35 to-amber-100/30 blur-2xl dark:from-emerald-900/20 dark:to-amber-900/10" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white shadow-2xl shadow-emerald-950/10 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">Fluxo documental</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">CPR Financeira · visão de exemplo</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">Em revisão</span>
            </div>
            <div className="space-y-1 p-3 sm:p-5">
              {steps.map((step, index) => (
                <div key={step.index} className="group flex gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:border-emerald-100 hover:bg-emerald-50/50 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-900 dark:text-white">{step.title}</h3>
                      <span className="font-mono text-[11px] text-gray-400">{step.index}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{step.description}</p>
                    {index < steps.length - 1 && <div className="mt-4 h-px bg-gray-100 dark:bg-gray-800" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/50">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
              <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">Campos não preenchidos permanecem identificados como pendentes. A emissão definitiva exige conferência das partes e dos registros aplicáveis.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
