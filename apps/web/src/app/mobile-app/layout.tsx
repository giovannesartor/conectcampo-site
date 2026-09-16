import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aplicativo',
  description: 'Acesse crédito, CPR, documentos, produção e mercado no aplicativo ConectCampo.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://app.conectcampo.digital' },
};

export default function MobileAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
