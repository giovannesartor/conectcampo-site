import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ConectCampo | Marketplace de Crédito Agro',
  description:
    'Conectamos produtores rurais e empresas do agronegócio a bancos, cooperativas, FIDCs, securitizadoras, FIAGROs e o mercado de capitais.',
  keywords: [
    'crédito rural',
    'agronegócio',
    'FIDC',
    'CRA',
    'FIAGRO',
    'marketplace agro',
    'crédito agro',
    'financiamento rural',
  ],
  openGraph: {
    title: 'ConectCampo | Marketplace de Crédito Agro',
    description:
      'Conectamos produtores rurais e empresas do agronegócio às melhores oportunidades de crédito.',
    url: 'https://conectcampo.com.br',
    siteName: 'ConectCampo',
    locale: 'pt_BR',
    type: 'website',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
