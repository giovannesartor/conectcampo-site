import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ConectCampo | Marketplace de Crédito Agro',
    template: '%s | ConectCampo',
  },
  description:
    'Conectamos produtores rurais e empresas do agronegócio a bancos, cooperativas, FIDCs, securitizadoras, FIAGROs e o mercado de capitais.',
  metadataBase: new URL('https://conectcampo.digital'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  keywords: [
    'crédito rural',
    'agronegócio',
    'FIDC',
    'CRA',
    'FIAGRO',
    'marketplace agro',
    'crédito agro',
    'financiamento rural',
    'CPR financeira',
    'CDCA',
    'LCA',
    'scoring agro',
    'produtor rural',
  ],
  openGraph: {
    title: 'ConectCampo | Marketplace de Crédito Agro',
    description:
      'Conectamos produtores rurais e empresas do agronegócio às melhores oportunidades de crédito. Do pequeno ao grande produtor.',
    url: 'https://conectcampo.digital',
    siteName: 'ConectCampo',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ConectCampo - Marketplace de Crédito Agro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConectCampo | Marketplace de Crédito Agro',
    description:
      'Conectamos produtores rurais e empresas do agro a bancos, cooperativas, FIDCs e o mercado de capitais.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://conectcampo.digital',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'ConectCampo',
              url: 'https://conectcampo.digital',
              logo: 'https://conectcampo.digital/apple-touch-icon.png',
              description:
                'Marketplace de crédito rural que conecta produtores e empresas do agronegócio a bancos, cooperativas, FIDCs, securitizadoras e FIAGROs.',
              foundingDate: '2023',
              sameAs: [],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: ['Portuguese'],
              },
            }),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
