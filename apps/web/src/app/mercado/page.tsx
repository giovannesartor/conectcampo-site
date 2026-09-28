import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { MarketWidget } from '@/components/dashboard/MarketWidget';

export const metadata = { title: 'Cotações do agro | ConectCampo', description: 'Consulte soja e milho por praça no widget oficial do Notícias Agrícolas.' };

export default function MarketPage() {
  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
    <header className="flex flex-wrap items-center justify-between gap-3"><Logo size="sm" /><Link href="/dashboard" className="btn-secondary">Meu painel</Link></header>
    <div className="my-8"><p className="section-kicker">Informação para o campo</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Cotações do agro</h1><p className="mt-3 text-sm leading-6 text-gray-500">Acompanhe os preços divulgados por praça. A fonte mantém as datas de fechamento e as unidades de cada referência.</p></div>
    <MarketWidget />
    <p className="mt-5 text-xs leading-6 text-gray-500">Cotações são referências, não ofertas de compra ou venda. Condições locais, qualidade, prazo e frete podem alterar o preço negociado.</p>
  </main>;
}
