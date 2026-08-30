import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { AudienceSplit } from '@/components/landing/AudienceSplit';
import { ProductShowcase } from '@/components/landing/ProductShowcase';
import { CprShowcase } from '@/components/landing/CprShowcase';
import { Platform } from '@/components/landing/Platform';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Segments } from '@/components/landing/Segments';
import { Security } from '@/components/landing/Security';
import { Plans } from '@/components/landing/Plans';
import { FAQ } from '@/components/landing/FAQ';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';
import { RevealInit } from '@/components/landing/RevealInit';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace de Crédito Agro | ConectCampo',
  description:
    'Crédito rural, CPR profissional, gestão da produção, documentos, crédito de carbono e mercado em uma plataforma conectada.',
  openGraph: {
    title: 'Marketplace de Crédito Agro | ConectCampo',
    description:
      'Crédito rural, CPR profissional, gestão da produção e mercado em uma única plataforma para o agro.',
  },
};

// JSON-LD (Schema.org) para indexação e rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'ConectCampo',
      url: 'https://conectcampo.digital',
      logo: 'https://conectcampo.digital/logo.png',
      description:
        'Plataforma completa para o agronegócio: crédito rural multi-financiador, marketplace de grãos com pagamento seguro, monitoramento por satélite (NDVI), clima, cotações, fluxo de caixa, CPR digital e crédito de carbono.',
      areaServed: 'BR',
    },
    {
      '@type': 'FinancialService',
      name: 'ConectCampo',
      url: 'https://conectcampo.digital',
      areaServed: 'BR',
      serviceType: 'Marketplace de crédito rural',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O que é a ConectCampo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Uma plataforma que organiza operações de crédito rural e aplica critérios de perfil e elegibilidade para aproximá-las de fontes compatíveis. A decisão final pertence a cada instituição.',
          },
        },
        {
          '@type': 'Question',
          name: 'Preciso pagar para usar a plataforma?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tomadores têm assinatura a partir de R$299/mês mais comissão sobre operações fechadas. Instituições financeiras entram gratuitamente.',
          },
        },
        {
          '@type': 'Question',
          name: 'Qual o prazo médio de aprovação?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O prazo depende da documentação, do perfil da operação e da instituição responsável. A plataforma agiliza o envio e o acompanhamento, sem prometer aprovação ou prazo único.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funciona a CPR e quanto custa a emissão?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A plataforma organiza os dados, gera a minuta completa e o PDF, coleta assinaturas e acompanha o status do registro. Na CPR Financeira, o custo ConectCampo é de 0,8% do valor de face; registro, tributos e encargos do credor, quando aplicáveis, são separados.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funciona o marketplace de grãos e o pagamento seguro?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'O comprador paga via ValsaPay, o ConectCampo retém o valor em custódia (escrow) e só libera ao vendedor após a confirmação do recebimento. Taxa de 1% por venda (0,5% de cada parte), com avaliações e liberação automática por prazo.',
          },
        },
        {
          '@type': 'Question',
          name: 'O que é o monitoramento por satélite (NDVI)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Acompanhamento da saúde da lavoura por imagens de satélite (índice NDVI, Sentinel-2) por talhão, ajudando a identificar problemas cedo e a compor o score de risco de safra.',
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Hero />
      {/* 1. Hook: você se identificou? */}
      <AudienceSplit />
      {/* 2. Como funciona (agenda mental clara) */}
      <HowItWorks />
      {/* 3. Veja a plataforma em ação */}
      <ProductShowcase />
      {/* 4. Fluxo premium de CPR */}
      <CprShowcase />
      {/* 5. Expansão: todas as ferramentas */}
      <Platform />
      {/* 6. Para cada porte */}
      <Segments />
      {/* 6. Prova social (só depois de entender o produto) */}
      <SocialProof />
      {/* 7. Segurança (remove objeção antes do preço) */}
      <Security />
      {/* 8. Planos + FAQ + CTA */}
      <Plans />
      <FAQ />
      <CTA />
      <Footer />
      <RevealInit />
    </main>
  );
}
