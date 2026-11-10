import { SiteHeader } from "@/components/experience/SiteHeader";
import { SiteFooter } from "@/components/experience/SiteFooter";
import { PublicSurface } from "@/components/experience/PublicSurface";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicSurface>
      <a className="cc-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="public-site">
        {children}
      </main>
      <SiteFooter />
    </PublicSurface>
  );
}
