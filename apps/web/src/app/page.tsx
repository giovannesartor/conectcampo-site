import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { AudienceSplit } from '@/components/landing/AudienceSplit';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Segments } from '@/components/landing/Segments';
import { Security } from '@/components/landing/Security';
import { Plans } from '@/components/landing/Plans';
import { FAQ } from '@/components/landing/FAQ';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';
import { RevealInit } from '@/components/landing/RevealInit';

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
        'Marketplace de crédito agro que conecta produtores rurais e empresas do agronegócio a bancos, cooperativas, FIDCs, securitizadoras e FIAGROs.',
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
            text: 'Um marketplace de crédito rural que conecta produtores e empresas do agro a bancos, cooperativas, FIDCs, securitizadoras e FIAGROs, usando inteligência para o matching ideal.',
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
            text: 'A pré-análise automática sai em até 48h. A aprovação final depende da instituição parceira.',
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
      <SocialProof />
      <AudienceSplit />
      <HowItWorks />
      <Segments />
      <Security />
      <Plans />
      <FAQ />
      <CTA />
      <Footer />
      <RevealInit />
    </main>
  );
}
