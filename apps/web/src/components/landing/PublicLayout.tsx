import { Header } from './Header';
import { Footer } from './Footer';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}
