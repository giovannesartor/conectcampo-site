import { Header } from './Header';
import { Footer } from './Footer';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell min-h-screen bg-white dark:bg-dark-bg">
      <Header />
      <main className="public-site overflow-hidden pt-[72px]">{children}</main>
      <Footer />
    </div>
  );
}
