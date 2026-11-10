import Link from "next/link";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { PageHero } from "@/components/experience/PageHero";
import { MarketWidget } from "@/components/dashboard/MarketWidget";

export const metadata = {
  title: "Cotações do agro | ConectCampo",
  description:
    "Consulte soja e milho por praça no widget oficial do Notícias Agrícolas.",
};

export default function MarketPage() {
  return (
    <PublicLayout>
      <PageHero>
        <p className="section-kicker">Informação para o campo</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Cotações do agro
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          Acompanhe os preços divulgados por praça. A fonte mantém as datas de
          fechamento e as unidades de cada referência.
        </p>
      </PageHero>
      <section className="mx-auto max-w-4xl px-6 py-16">
        <Link href="/dashboard" className="btn-secondary mb-8">
          Meu painel
        </Link>
        <MarketWidget />
        <p className="mt-5 text-xs leading-6 text-gray-500">
          Cotações são referências, não ofertas de compra ou venda. Condições
          locais, qualidade, prazo e frete podem alterar o preço negociado.
        </p>
      </section>
    </PublicLayout>
  );
}
