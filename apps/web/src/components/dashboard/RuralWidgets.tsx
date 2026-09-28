'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, CalendarDays, CloudSun, LayoutGrid } from 'lucide-react';
import { MarketWidget } from './MarketWidget';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });


// BR decimal entry, without silently interpreting "128,50" as 12,850.
function decimal(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const number = Number(value.replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function RuralWidgets() {
  const id = useId();
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const sacks = decimal(quantity);
  const unitPrice = decimal(price);
  const total = sacks !== null && unitPrice !== null ? sacks * unitPrice : null;

  return (
    <section aria-label="Ferramentas para o seu dia" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-950 dark:text-white">Seu dia no campo</h2>
        <Link href="/dashboard/quotes" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">Ver mercado <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <MarketWidget />
        <div className="card">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Calculator className="h-4 w-4 text-brand-600" /> Quanto valem suas sacas?</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Informe a quantidade e o preço negociado por saca.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div><label htmlFor={`${id}-quantity`} className="label">Sacas</label><input id={`${id}-quantity`} value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" maxLength={12} placeholder="Ex.: 100" className="input" aria-invalid={quantity !== '' && sacks === null} /></div>
            <div><label htmlFor={`${id}-price`} className="label">R$ por saca</label><input id={`${id}-price`} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" maxLength={12} placeholder="Ex.: 128,50" className="input" aria-invalid={price !== '' && unitPrice === null} /></div>
          </div>
          <div aria-live="polite" className="mt-4 rounded-xl bg-brand-50 p-3 dark:bg-brand-950/30">
            <p className="text-xs text-brand-700 dark:text-brand-300">Valor bruto estimado</p>
            <p className="mt-1 break-words text-xl font-bold text-brand-800 dark:text-brand-200" style={{ overflowWrap: 'anywhere' }}>{total !== null ? currency.format(total) : 'Informe os dois valores'}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Sem frete, descontos ou tributos. Use vírgula ou ponto para os decimais, sem separador de milhar. Nada é salvo ou contratado.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/weather" className="card card-hover flex items-center gap-3 !p-4"><CloudSun className="h-5 w-5 shrink-0 text-brand-600" /><span className="text-sm font-semibold">Clima e alertas</span><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400" /></Link>
        <Link href="/dashboard/calendar" className="card card-hover flex items-center gap-3 !p-4"><CalendarDays className="h-5 w-5 shrink-0 text-brand-600" /><span className="text-sm font-semibold">Minha agenda</span><ArrowRight className="ml-auto h-4 w-4 shrink-0 text-gray-400" /></Link>
      </div>
      <Link href="/dashboard/widgets" className="flex min-h-11 items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200"><LayoutGrid className="h-4 w-4 shrink-0" />Leve seu campo para a tela de início do iPhone<ArrowRight className="ml-auto h-4 w-4 shrink-0" /></Link>
    </section>
  );
}
