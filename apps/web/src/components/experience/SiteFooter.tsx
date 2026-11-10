import Link from "next/link";
import { Logo } from "@/components/Logo";
export function SiteFooter() {
  return (
    <footer className="cc-footer">
      <div className="cc-container">
        <div className="cc-footer-grid">
          <div>
            <Logo size="md" />
            <p>
              Crédito, gestão e conexões.
              <br />
              Para o agro seguir em frente.
            </p>
          </div>
          <div>
            <h3>Plataforma</h3>
            <Link href="/plataforma">Recursos</Link>
            <Link href="/planos">Planos</Link>
            <Link href="/parceiros">Parceiros</Link>
            <Link href="/api-docs">API e integrações</Link>
          </div>
          <div>
            <h3>ConectCampo</h3>
            <Link href="/sobre">Sobre nós</Link>
            <Link href="/blog">Conteúdos</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/ajuda">Central de ajuda</Link>
          </div>
          <div>
            <h3>Transparência</h3>
            <Link href="/legal/privacidade">Privacidade</Link>
            <Link href="/legal/termos-de-uso">Termos de uso</Link>
            <Link href="/legal/lgpd">LGPD</Link>
            <Link href="/legal/compliance">Compliance</Link>
          </div>
        </div>
        <div className="cc-footer-bottom">
          <span>© {new Date().getFullYear()} ConectCampo · AG Digital</span>
          <span>
            AG PARTICIPACOES SOCIETARIAS LTDA · CNPJ 54.079.299/0001-40
          </span>
        </div>
        <p className="cc-legal">
          A ConectCampo não é uma instituição financeira. Atuamos como
          marketplace conectando oferta e demanda de crédito.
        </p>
      </div>
    </footer>
  );
}
