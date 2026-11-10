"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FileCheck2,
  Landmark,
  Sprout,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FieldVisual } from "@/components/experience/FieldVisual";
import { useAuth } from "@/lib/auth-context";
import "@/components/experience/experience.css";

const capabilities = [
  { icon: Landmark, label: "Crédito e propostas" },
  { icon: FileCheck2, label: "CPR e documentos" },
  { icon: Sprout, label: "Produção e campo" },
  { icon: BarChart3, label: "Mercado e gestão" },
];

export default function MobileAppPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, router, user]);

  if (isLoading || user)
    return (
      <main className="cc-app-loading">
        <div role="status" aria-live="polite">
          <Logo size="lg" variant="icon" href="" />
          <span className="cc-loading-line" />
          <p>Preparando seu ConectCampo…</p>
        </div>
      </main>
    );

  return (
    <main className="cc-app-entry">
      <section className="cc-app-brand-panel" aria-labelledby="app-title">
        <Image
          src="/images/campo-landscape.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 700px) 100vw, 50vw"
          className="cc-landscape"
        />
        <div className="cc-art-shade" />
        <FieldVisual compact />
        <header>
          <Logo variant="icon" size="md" href="" />
          <span>ConectCampo</span>
        </header>
        <div className="cc-app-editorial">
          <span className="cc-eyebrow">
            <span className="cc-dot" /> SEU CAMPO. SUA PRÓXIMA CONQUISTA.
          </span>
          <h1 id="app-title">
            Raízes no campo.
            <br />
            <em>Olhar no futuro.</em>
          </h1>
          <p>
            Sua operação merece uma visão completa. Conecte crédito, produção e
            oportunidades, onde você estiver.
          </p>
        </div>
        <footer>CRÉDITO &nbsp; / &nbsp; GESTÃO &nbsp; / &nbsp; CONEXÃO</footer>
      </section>
      <section className="cc-app-entry-panel" aria-labelledby="welcome-title">
        <div className="cc-app-entry-inner">
          <div className="cc-app-entry-top">
            <span>
              <ShieldCheck size={15} /> Sua conta. Seu ambiente.
            </span>
            <ThemeToggle />
          </div>
          <span className="cc-eyebrow">BEM-VINDO AO CONECTCAMPO</span>
          <h2 id="welcome-title">
            O próximo passo
            <br />
            começa aqui.
          </h2>
          <p>
            Entre para acompanhar sua operação ou crie sua conta para começar.
          </p>
          <div className="cc-app-capabilities">
            {capabilities.map(({ icon: Icon, label }) => (
              <div key={label}>
                <Icon />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="cc-app-entry-actions">
            <Link href="/login" className="cc-button">
              Entrar na minha conta <ArrowUpRight size={20} />
            </Link>
            <Link href="/register" className="cc-button cc-button-outline">
              Criar minha conta
            </Link>
          </div>
          <p className="cc-app-legal">
            Conheça os <Link href="/legal/termos-de-uso">Termos de Uso</Link> e
            a <Link href="/legal/privacidade">Política de Privacidade</Link>.
            <br />
            Acesse com sua conta da plataforma. Requer internet.
          </p>
          <div className="cc-app-support">
            <Link href="/ajuda">Precisa de ajuda?</Link>
            <span>·</span>
            <Link href="/contato">Fale com a equipe</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
