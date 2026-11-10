"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  Menu,
  X,
  Plus,
  Check,
  Landmark,
  FileCheck2,
  Sprout,
  ShieldCheck,
  Smartphone,
  Monitor,
  Layers3,
  LockKeyhole,
  BarChart3,
  Wheat,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PRODUCT_PLANS } from "@/lib/product-plans";
import { FieldVisual } from "./FieldVisual";
import { APP_STORE_URL, homeQuestions } from "./content";
import "./experience.css";

const modules = [
  {
    icon: Landmark,
    title: "Crédito rural",
    caption: "Da solicitação à proposta.",
    text: "Organize sua operação, apresente documentos e acompanhe propostas de fontes de crédito compatíveis com seu perfil.",
    items: [
      "Solicitações organizadas",
      "Propostas em um só lugar",
      "Acompanhamento por etapa",
    ],
    label: "Operação de crédito",
    steps: [
      "Cadastro da operação",
      "Documentação",
      "Análise da instituição",
      "Proposta",
    ],
    href: "/como-funciona",
  },
  {
    icon: FileCheck2,
    title: "CPR e documentos",
    caption: "Cada documento no seu lugar.",
    text: "Reúna informações, prepare sua CPR e acompanhe o fluxo de documentos e assinaturas com mais clareza.",
    items: [
      "CPR física e financeira",
      "Minutas e PDFs",
      "Documentos com controle de acesso",
    ],
    label: "Fluxo documental",
    steps: [
      "Dados da CPR",
      "Conferência da minuta",
      "Assinaturas",
      "Acompanhamento do registro",
    ],
    href: "/plataforma",
  },
  {
    icon: Sprout,
    title: "Gestão do campo",
    caption: "Uma visão mais próxima da produção.",
    text: "Conecte propriedades, talhões e safras às informações que ajudam a acompanhar sua rotina no campo.",
    items: [
      "Propriedades e talhões",
      "Clima e monitoramento NDVI",
      "Diário de safra",
    ],
    label: "Rotina da propriedade",
    steps: [
      "Cadastro da fazenda",
      "Organização dos talhões",
      "Acompanhamento da safra",
      "Registro de atividades",
    ],
    href: "/plataforma",
  },
  {
    icon: BarChart3,
    title: "Mercado e gestão",
    caption: "Contexto para a próxima decisão.",
    text: "Acompanhe cotações, organize o fluxo de caixa e mantenha contratos e compromissos perto da sua operação.",
    items: [
      "Cotações e alertas",
      "Fluxo de caixa e calendário",
      "Contratos de venda e barter",
    ],
    label: "Visão da operação",
    steps: [
      "Consulta ao mercado",
      "Planejamento financeiro",
      "Organização de contratos",
      "Agenda de compromissos",
    ],
    href: "/plataforma",
  },
];

function useReveals() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !root.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("cc-revealed");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    root.current.querySelectorAll("[data-reveal]").forEach((el) => {
      el.classList.add("cc-reveal-ready");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return root;
}

export function HomeExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const menuButton = useRef<HTMLButtonElement>(null);
  const root = useReveals();
  const selected = modules[activeModule];
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
    <div className="cc-home" ref={root}>
      <a className="cc-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="cc-header">
        <div className="cc-container cc-nav">
          <Logo size="md" />
          <nav className="cc-desktop-nav" aria-label="Navegação principal">
            <a href="#plataforma">A plataforma</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#planos">Planos</a>
            <a href="#aplicativo">Aplicativo</a>
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
              ["A plataforma", "#plataforma"],
              ["Como funciona", "#como-funciona"],
              ["Planos", "#planos"],
              ["Aplicativo", "#aplicativo"],
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

      <main id="conteudo">
        <section className="cc-hero">
          <div className="cc-container cc-hero-grid">
            <div className="cc-hero-copy">
              <span className="cc-eyebrow">
                <span className="cc-dot" /> TECNOLOGIA COM RAÍZES NO CAMPO
              </span>
              <h1>
                O seu agro.
                <br />
                Mais conectado.
                <br />
                <em>Mais adiante.</em>
              </h1>
              <p>
                Crédito, gestão e oportunidades em uma só plataforma. A conexão
                entre quem produz e o que faz o campo crescer.
              </p>
              <div className="cc-actions">
                <Link href="/register" className="cc-button">
                  Começar minha jornada <ArrowUpRight size={19} />
                </Link>
                <a href="#plataforma" className="cc-text-link">
                  Conheça a plataforma <ArrowDown size={17} />
                </a>
              </div>
              <div className="cc-hero-note">
                <ShieldCheck size={17} />
                <span>Uma conta. Sua operação conectada.</span>
              </div>
            </div>
            <div className="cc-hero-art">
              <Image
                src="/images/campo-landscape.jpg"
                alt="Lavoura ao nascer do sol, com linhas de plantio até o horizonte"
                fill
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
                className="cc-landscape"
              />
              <div className="cc-art-shade" />
              <FieldVisual />
              <div className="cc-art-top">
                <span>VISÃO QUE VAI ALÉM.</span>
                <span className="cc-compass">
                  N <ArrowUpRight size={22} />
                </span>
              </div>
              <div className="cc-field-tag">
                <span className="cc-dot" /> DO CAMPO À PRÓXIMA CONQUISTA
              </div>
              <div className="cc-art-card">
                <div className="cc-art-card-icon">
                  <Layers3 size={23} />
                </div>
                <div>
                  <span>UM ECOSSISTEMA. MAIS POSSIBILIDADES.</span>
                  <strong>Sua operação, por inteiro.</strong>
                </div>
                <ArrowUpRight size={23} />
              </div>
              <span className="cc-art-foot">
                CRÉDITO &nbsp; / &nbsp; GESTÃO &nbsp; / &nbsp; CONEXÃO
              </span>
            </div>
          </div>
          <div className="cc-container cc-hero-bottom">
            <span>PARA QUEM MOVE O AGRO</span>
            <div>
              <span>Produtores rurais</span>
              <span>Empresas</span>
              <span>Cooperativas</span>
              <span>Instituições financeiras</span>
            </div>
          </div>
        </section>

        <section id="plataforma" className="cc-section cc-container">
          <div className="cc-section-heading" data-reveal>
            <div>
              <span className="cc-eyebrow">01 / UMA VISÃO COMPLETA</span>
              <h2>
                O campo é complexo.
                <br />
                <em>Sua gestão não precisa ser.</em>
              </h2>
            </div>
            <p>
              Menos informações espalhadas.
              <br />
              Mais clareza para cuidar da operação, acessar crédito e planejar o
              próximo passo.
            </p>
          </div>
          <div
            className="cc-module-tabs"
            role="group"
            aria-label="Explorar recursos da plataforma"
          >
            {modules.map(({ icon: Icon, title }, i) => (
              <button
                key={title}
                aria-pressed={activeModule === i}
                aria-controls="cc-module-panel"
                onClick={() => setActiveModule(i)}
              >
                <Icon size={20} />
                {title}
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
          <div className="cc-module-panel" id="cc-module-panel">
            <div className="cc-module-copy" key={`copy-${activeModule}`}>
              <span className="cc-eyebrow">{selected.title}</span>
              <h3>{selected.caption}</h3>
              <p>{selected.text}</p>
              <ul>
                {selected.items.map((item) => (
                  <li key={item}>
                    <Check size={17} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={selected.href} className="cc-text-link">
                Explorar recursos <ArrowRight size={18} />
              </Link>
            </div>
            <div className="cc-workspace" key={`view-${activeModule}`}>
              <div className="cc-workspace-top">
                <span>
                  <Layers3 size={16} /> ConectCampo
                </span>
                <span>VISÃO ILUSTRATIVA</span>
              </div>
              <div className="cc-workspace-body">
                <div className="cc-workspace-label">
                  <span>ACOMPANHAMENTO</span>
                  <ShieldCheck size={19} />
                </div>
                <h4>{selected.label}</h4>
                <p>Um fluxo claro, do início ao próximo passo.</p>
                <div className="cc-workflow">
                  {selected.steps.map((step, i) => (
                    <div key={step}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <strong>{step}</strong>
                      <ChevronRight size={16} />
                    </div>
                  ))}
                </div>
                <div className="cc-workspace-footer">
                  <LockKeyhole size={14} /> Informações organizadas em um só
                  ambiente
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="cc-process">
          <div className="cc-container">
            <div className="cc-section-heading" data-reveal>
              <div>
                <span className="cc-eyebrow">
                  02 / DO SEU LADO, EM CADA ETAPA
                </span>
                <h2>
                  Seu próximo passo.
                  <br />
                  <em>Com mais direção.</em>
                </h2>
              </div>
              <Link href="/como-funciona" className="cc-text-link">
                Entenda o processo <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="cc-steps">
              {[
                {
                  title: "Sua operação ganha forma.",
                  text: "Crie seu perfil e reúna os dados da propriedade, da produção e dos seus objetivos.",
                },
                {
                  title: "As informações se conectam.",
                  text: "Organize documentos, acompanhe análises e encontre fontes de crédito compatíveis.",
                },
                {
                  title: "Você acompanha a evolução.",
                  text: "Consulte propostas, etapas e compromissos. Tudo no mesmo ambiente.",
                },
              ].map((step, i) => (
                <article key={step.title} data-reveal>
                  <span className="cc-step-number">0{i + 1}</span>
                  <div className="cc-step-line" />
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <p className="cc-process-note">
              A aprovação e as condições do crédito dependem da análise de cada
              instituição financeira.
            </p>
          </div>
        </section>

        <section className="cc-container cc-section cc-audience" data-reveal>
          <div>
            <span className="cc-eyebrow">CONEXÕES QUE FAZEM SENTIDO</span>
            <h2>
              De quem planta.
              <br />
              <em>A quem investe.</em>
            </h2>
            <p>
              Uma estrutura para diferentes papéis, conectados pelo mesmo
              propósito: movimentar o agronegócio.
            </p>
          </div>
          <div className="cc-audience-links">
            {[
              {
                icon: Wheat,
                title: "Produtores, empresas e cooperativas",
                text: "Organize a produção e encontre caminhos para financiar sua operação.",
                href: "/register",
              },
              {
                icon: Landmark,
                title: "Instituições financeiras",
                text: "Analise operações organizadas e gerencie propostas em um ambiente conectado.",
                href: "/register?plan=CORPORATE",
              },
            ].map(({ icon: Icon, title, text, href }) => (
              <Link href={href} key={title}>
                <Icon size={27} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <ArrowUpRight size={22} />
              </Link>
            ))}
          </div>
        </section>

        <section id="aplicativo" className="cc-app-section">
          <div className="cc-container cc-app-grid">
            <div className="cc-app-copy" data-reveal>
              <span className="cc-eyebrow">03 / O CAMPO ACOMPANHA VOCÊ</span>
              <h2>
                Da mesa do escritório
                <br />
                <em>à palma da mão.</em>
              </h2>
              <p>
                A mesma conta. A mesma operação. Acesse sua plataforma online
                pelo computador ou leve o ConectCampo com você no iPhone e no
                iPad.
              </p>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-store-link"
              >
                <Smartphone size={29} />
                <span>
                  <small>Disponível na</small>
                  <strong>App Store</strong>
                </span>
                <ArrowUpRight size={21} />
              </a>
              <div className="cc-platform-status">
                <span>
                  <span className="cc-dot" /> iOS publicado
                </span>
                <span className="cc-android">
                  <span /> Android em desenvolvimento
                </span>
              </div>
              <Link href="/mobile-app" className="cc-text-link">
                Acessar pelo navegador <ArrowRight size={17} />
              </Link>
              <p className="cc-connection-note">
                Requer conexão com a internet. No Android, acesse pelo navegador
                enquanto o aplicativo é desenvolvido.
              </p>
            </div>
            <div className="cc-device-scene" data-reveal>
              <FieldVisual />
              <div className="cc-device">
                <div className="cc-device-top">
                  <span>ConectCampo</span>
                  <span className="cc-device-camera" />
                </div>
                <div className="cc-phone-welcome">
                  <span>SUA VISÃO DO CAMPO</span>
                  <strong>
                    Um bom dia começa
                    <br />
                    com clareza.
                  </strong>
                </div>
                <div className="cc-phone-field">
                  <Image
                    src="/images/campo-landscape.jpg"
                    alt=""
                    fill
                    sizes="300px"
                  />
                  <span>
                    <MapPin size={14} /> Sua propriedade, mais perto.
                  </span>
                </div>
                <div className="cc-phone-grid">
                  {[
                    { icon: Landmark, text: "Crédito" },
                    { icon: FileCheck2, text: "Documentos" },
                    { icon: Sprout, text: "Produção" },
                    { icon: BarChart3, text: "Mercado" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text}>
                      <Icon size={21} />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <div className="cc-phone-bottom">
                  <ShieldCheck size={16} /> Tudo conectado à sua conta.
                </div>
                <span className="cc-home-indicator" />
              </div>
              <span className="cc-device-caption">
                REPRESENTAÇÃO ILUSTRATIVA DA PLATAFORMA
              </span>
            </div>
          </div>
        </section>

        <section className="cc-container cc-trust" data-reveal>
          <div>
            <LockKeyhole />
            <h3>Controle de acesso</h3>
            <p>
              Documentos e informações respeitando os perfis e as permissões da
              plataforma.
            </p>
          </div>
          <div>
            <ShieldCheck />
            <h3>Transparência em cada etapa</h3>
            <p>
              Acompanhe o andamento da operação e consulte as condições de cada
              proposta.
            </p>
          </div>
          <div>
            <Monitor />
            <h3>Uma operação conectada</h3>
            <p>Continue no navegador ou no aplicativo, usando a mesma conta.</p>
          </div>
        </section>

        <section id="planos" className="cc-plans cc-section">
          <div className="cc-container">
            <div className="cc-section-heading" data-reveal>
              <div>
                <span className="cc-eyebrow">04 / ESPAÇO PARA CRESCER</span>
                <h2>
                  O plano certo.
                  <br />
                  <em>Para o seu momento.</em>
                </h2>
              </div>
              <p>
                Conheça os planos para a sua operação.
                <br />7 dias grátis nos planos pagos. Instituições financeiras
                entram gratuitamente.
              </p>
            </div>
            <div className="cc-plan-grid">
              {PRODUCT_PLANS.map((plan) => (
                <article
                  className={`cc-plan ${plan.highlighted ? "cc-plan-featured" : ""}`}
                  key={plan.id}
                  data-reveal
                >
                  <div className="cc-plan-label">
                    <span>
                      {plan.id === "START"
                        ? "PRODUTOR RURAL"
                        : plan.id === "PRO"
                          ? "EMPRESA"
                          : plan.id === "COOPERATIVE"
                            ? "COOPERATIVA"
                            : "INSTITUIÇÃO FINANCEIRA"}
                    </span>
                    {plan.highlighted && <Layers3 size={18} />}
                  </div>
                  <h3>
                    {plan.price}
                    <small>{plan.period}</small>
                  </h3>
                  <p>{plan.description}</p>
                  <ul>
                    {plan.features.slice(0, 3).map((feature) => (
                      <li key={feature}>
                        <Check size={15} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={
                      plan.highlighted
                        ? "cc-button"
                        : "cc-button cc-button-outline"
                    }
                  >
                    {plan.period
                      ? "Experimentar agora"
                      : "Criar conta gratuita"}
                    <ArrowUpRight size={17} />
                  </Link>
                </article>
              ))}
            </div>
            <div className="cc-plans-note">
              <p>
                Valores para contratação pela web. No iOS, consulte preços e
                condições na App Store. Comissões sobre operações fechadas são
                cobradas à parte.
              </p>
              <Link href="/planos" className="cc-text-link">
                Comparar todos os recursos <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="cc-container cc-section cc-faq">
          <div data-reveal>
            <span className="cc-eyebrow">ANTES DO PRÓXIMO PASSO</span>
            <h2>
              Clareza desde
              <br />
              <em>o começo.</em>
            </h2>
            <Link href="/ajuda" className="cc-text-link">
              Visite a central de ajuda <ArrowUpRight size={17} />
            </Link>
          </div>
          <div>
            {homeQuestions.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus size={19} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cc-final">
          <div className="cc-container" data-reveal>
            <span className="cc-eyebrow">CONECTCAMPO</span>
            <h2>
              O futuro do seu campo
              <br />
              começa com <em>uma conexão.</em>
            </h2>
            <Link href="/register" className="cc-button">
              Vamos começar <ArrowUpRight size={20} />
            </Link>
            <Link href="/contato" className="cc-text-link">
              Fale com a nossa equipe <ArrowRight size={18} />
            </Link>
          </div>
          <FieldVisual />
        </section>
      </main>
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
    </div>
  );
}
