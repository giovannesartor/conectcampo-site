"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
export function SiteHeader() {
  const menuButton = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const home = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);
  return (
    <header className="cc-header">
      <div className="cc-container cc-nav">
        <Logo size="md" />
        <nav className="cc-desktop-nav" aria-label="Navegação principal">
          <a
            aria-current={pathname === "/plataforma" ? "page" : undefined}
            href={home ? "/#plataforma" : "/plataforma"}
          >
            A plataforma
          </a>
          <a
            aria-current={pathname === "/como-funciona" ? "page" : undefined}
            href={home ? "/#como-funciona" : "/como-funciona"}
          >
            Como funciona
          </a>
          <a
            aria-current={pathname === "/planos" ? "page" : undefined}
            href={home ? "/#planos" : "/planos"}
          >
            Planos
          </a>
          <a href="/#aplicativo">Aplicativo</a>
        </nav>
        <div className="cc-nav-actions">
          <ThemeToggle />
          <Link href="/login" className="cc-login">
            Entrar
          </Link>
          <Link href="/register" className="cc-button cc-button-small">
            Começar agora <ArrowUpRight size={16} />
          </Link>
          <button
            ref={menuButton}
            className="cc-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="cc-mobile-menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          className="cc-mobile-menu cc-container"
          id="cc-mobile-menu"
          aria-label="Navegação móvel"
        >
          {[
            ["A plataforma", "/plataforma"],
            ["Como funciona", "/como-funciona"],
            ["Planos", "/planos"],
            ["Aplicativo", "/#aplicativo"],
            ["Sobre nós", "/sobre"],
            ["Conteúdos", "/blog"],
            ["Contato", "/contato"],
            ["Entrar", "/login"],
            ["Criar minha conta", "/register"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
