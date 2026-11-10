import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FieldVisual } from "./FieldVisual";
import "./experience.css";
import "./public.css";

export function AuthShell({
  children,
  eyebrow = "SUA OPERAÇÃO, MAIS CONECTADA",
  title = "Raízes no campo.",
  accent = "Olhar no futuro.",
  description = "Crédito, produção e oportunidades em uma plataforma que acompanha o seu próximo passo.",
}: {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  accent?: string;
  description?: string;
}) {
  return (
    <div className="cc-app-entry cc-auth">
      <aside className="cc-app-brand-panel">
        <Image
          src="/images/campo-landscape.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 700px) 100vw, 50vw"
          className="cc-landscape"
        />
        <div className="cc-art-shade" />
        <FieldVisual />
        <header>
          <Logo variant="icon" size="md" />
          <Link href="/">ConectCampo</Link>
        </header>
        <div className="cc-app-editorial">
          <span className="cc-eyebrow">
            <span className="cc-dot" />
            {eyebrow}
          </span>
          <h2>
            {title}
            <br />
            <em>{accent}</em>
          </h2>
          <p>{description}</p>
        </div>
        <footer>CRÉDITO &nbsp; / &nbsp; GESTÃO &nbsp; / &nbsp; CONEXÃO</footer>
      </aside>
      <main className="cc-auth-main">
        <div className="cc-auth-form">
          <div className="cc-auth-toolbar">
            <Link href="/" aria-label="Voltar ao início">
              <ArrowLeft size={16} />
              Início
            </Link>
            <ThemeToggle />
          </div>
          <span className="cc-eyebrow">
            <ShieldCheck size={14} /> SEU AMBIENTE CONECTCAMPO
          </span>
          <div className="cc-auth-content">{children}</div>
          <footer className="cc-auth-footer">
            <Link href="/legal/privacidade">Privacidade</Link>
            <span>·</span>
            <Link href="/ajuda">Precisa de ajuda?</Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
