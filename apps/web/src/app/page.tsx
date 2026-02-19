import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Segments } from '@/components/landing/Segments';
import { Security } from '@/components/landing/Security';
import { Plans } from '@/components/landing/Plans';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      <Hero />
      <HowItWorks />
      <Segments />
      <Security />
      <Plans />
      <CTA />
      <Footer />
    </main>
  );
}
