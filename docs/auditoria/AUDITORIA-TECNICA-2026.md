# 🔍 Auditoria Técnica Completa — ConectCampo

**Data:** 28/06/2026
**Versão do produto auditado:** monorepo `conectcampo` v0.1.0 (commit `37b4bcf`)
**Sistema em produção:** https://conectcampo.digital
**Stack:** Turborepo · Next.js 14 (App Router) · NestJS 10 · Prisma 5 · PostgreSQL 16 · Railway
**Escopo:** Arquitetura, Backend, Frontend, Banco, Segurança, Performance, SEO, UX, Design, Mocks, Concorrência, Produto, Roadmap.

> **Sumário executivo em uma frase:** O ConectCampo é um produto **tecnicamente sólido e acima da média** para o estágio em que está — a base de segurança e arquitetura é boa de verdade — mas está a uma camada de **polimento de design, prova social, dados reais e maturidade de produto** de parecer um SaaS de nível internacional. Não há nada "quebrado por dentro"; o que falta é **acabamento premium e credibilidade**.

---

## 0. Como ler este relatório

Cada achado está classificado por:

- **Severidade:** 🔴 Crítico · 🟠 Alto · 🟡 Médio · 🟢 Baixo
- **Esforço:** ⚡ Baixo (horas) · 🔨 Médio (dias) · 🏗️ Alto (semanas)
- **Impacto:** ⭐ a ⭐⭐⭐⭐⭐

A última seção traz o **Roadmap em 9 fases** consolidando tudo com prioridade, dificuldade, impacto, tempo e arquivos.

---

## 1. Veredito geral & nota por área

| Área | Nota (0–10) | Comentário curto |
|---|---|---|
| Arquitetura | **8.0** | Monorepo limpo, separação clara, NestJS modular bem feito |
| Backend / API | **7.5** | Services reais, scoring e matching de verdade, bom tratamento de erro |
| Banco de dados | **8.0** | 30 modelos, 56 índices/uniques, soft-delete, audit log |
| Segurança | **7.5** | Já bem acima da média; faltam alguns hardenings |
| Frontend | **7.0** | Código organizado, mas zero testes e re-render não otimizado |
| Design / UI | **5.5** | "OK" — funcional, mas longe de premium. Maior oportunidade. |
| Performance | **6.5** | Next OK, mas faltam otimizações de imagem/bundle e medição |
| SEO | **4.5** | Metadata boa, mas **sem robots.txt, sitemap, JSON-LD**; OG quebrado |
| UX / Conversão | **6.0** | Boa estrutura, mas atrito no cadastro e pouca prova social |
| Dados reais vs mock | **6.5** | Dashboards reais; alguns pontos ilustrativos a substituir |
| Testes / Qualidade | **4.0** | API tem alguns specs; **web não tem nenhum teste** |
| Produto / Maturidade | **5.5** | Falta prova social, casos, status público, integrações reais |

**Nota global ponderada: ~6.5/10.** Para chegar a "nível Stripe/Linear" (9+), o caminho passa por **design premium + dados/prova social reais + qualidade (testes/observabilidade) + diferenciais de produto (IA, integrações)**.

### ⚠️ Observação importante sobre o `AUDITORIA.md` existente

O arquivo `AUDITORIA.md` (08/06) está **desatualizado**. Vários itens marcados como críticos/pendentes **já foram corrigidos** desde então e isso é verificável no código atual:

| Item do AUDITORIA.md antigo | Status real hoje |
|---|---|
| "JWT sem rotação de refresh token" | ✅ **Implementado** — rotate-on-use em `auth.service.ts:234` |
| "Middleware decodifica sem verificar" | ✅ **Corrigido** — usa `jose.jwtVerify` em `middleware.ts:49` |
| "Sem rate limiting por rota" | ✅ **Feito** — `@Throttle` no login (5/min), forgot (3/min) em `auth.controller.ts` |
| "Sem CSP" | ✅ **Feito** — CSP explícita em `main.ts` |
| "Swagger desatualizado" | ✅ Tags `carbon-credits`, `quantovale`, `webhooks`, `notifications` presentes |

> Recomendação de processo: **excluir ou arquivar** o `AUDITORIA.md` antigo para não confundir o time. Este documento o substitui.

---

## 2. Arquitetura & Organização (Nota 8.0)

### 2.1 O que está muito bom ✅

- **Monorepo Turborepo** bem estruturado: `apps/web`, `apps/api`, `packages/types`, `packages/utils`, `prisma/` na raiz. Separação de responsabilidades correta.
- **Tipos compartilhados** em `@conectcampo/types` — evita drift entre front e back. Excelente decisão.
- **NestJS modular**: 20+ módulos coesos (`auth`, `operations`, `scoring`, `matching`, `subscriptions`, `carbon-credits`, `quantovale`, `documents`, `notifications`, `audit`, etc.), cada um com controller/service/dto. Isso é **Clean Architecture na prática** para o ecossistema Nest.
- **`common/`** com `filters` (exception filter global), `interceptors` (logging), `logger`, `validators` (IsCPF/IsCNPJ). Cross-cutting concerns isolados — ótimo.
- **Prisma centralizado** em `prisma/schema.prisma` consumido pelos dois apps.

### 2.2 Pontos de atenção

| # | Severidade | Achado | Recomendação |
|---|---|---|---|
| A1 | 🟡 | `packages/types/dist` e `apps/api/dist` versionados no working tree | Garantir `.gitignore` cobre `dist/` (build deve ser artefato, não fonte) |
| A2 | 🟡 | `postinstall` roda `prisma generate` na raiz — bom — mas Dockerfiles precisam garantir o generate no build | Validar `Dockerfile.api` (item crítico do audit antigo) |
| A3 | 🟢 | Sem camada de **DTO de resposta / serializers** explícita em alguns módulos | Adotar `class-transformer` + `@Exclude/@Expose` para nunca vazar campos sensíveis (ex.: `passwordHash`) |
| A4 | 🟢 | Lógica de negócio (scoring/matching) acoplada ao Prisma direto no service | Para escala/testabilidade, considerar repository pattern fino (interface) — opcional, hoje é aceitável |

### 2.3 Sugestão estratégica (DDD leve)

Hoje a regra de negócio vive nos services, o que é adequado. Se o produto crescer para **dezenas de tipos de operação e parceiros**, vale extrair um **domínio puro** (`domain/`) para `scoring` e `matching` — funções puras testáveis sem DB — e deixar o service só orquestrando. Isso destrava testes unitários rápidos e reaproveitamento (ex.: rodar o score no front em modo simulação).

---

## 3. Backend / API (Nota 7.5)

### 3.1 O que está muito bom ✅

- **`main.ts` exemplar**: Helmet + **CSP explícita**, CORS por env (multi-origin), prefixo global `/api/v1` com exclusão correta do webhook, `ValidationPipe` com `whitelist + forbidNonWhitelisted + transform`, exception filter global, logging interceptor, **boot recusa iniciar sem `JWT_SECRET`**.
- **Scoring real** (`scoring.service.ts`): motor ponderado de 7 fatores (receita, histórico, garantias, endividamento, fluxo de caixa, histórico de crédito, seguro) com pesos explícitos. **Não é mock** — calcula sobre `financialProfile` real.
- **Matching real** (`matching.service.ts`): 6 fatores (ticket, garantia, região, cultura, score, tipo de operação), itera parceiros ativos e persiste `MatchResult`. Lógica de negócio de verdade.
- **Auth maduro** (`auth.service.ts`): refresh token com **rotação (rotate-on-use)**, revogação em massa no reset/logout, `PasswordResetToken` e `EmailVerificationToken` dedicados, throttle por rota.
- **Testes existentes**: `auth.service.spec.ts`, `matching.service.spec.ts`, `scoring.service.spec.ts`, `carbon-credits.service.spec.ts`.

### 3.2 Achados

| # | Sev | Esf | Achado | Arquivo | Recomendação |
|---|---|---|---|---|---|
| B1 | 🟠 | 🔨 | **Sem idempotência no webhook Asaas** | `modules/webhooks`, `subscriptions/asaas.service.ts` | Persistir `asaasEventId` processados e ignorar duplicados (retry do Asaas re-aplica estado) |
| B2 | 🟠 | 🔨 | **Sem assinatura HMAC no webhook** — só token fixo | `modules/webhooks` | Validar HMAC-SHA256 do payload; rejeitar replay |
| B3 | 🟡 | ⚡ | Risco de **vazar `passwordHash`/campos internos** em respostas que retornam o `User` cru | vários services | `@Exclude()` no campo + `ClassSerializerInterceptor`, ou `select` explícito sempre |
| B4 | 🟡 | 🔨 | **N+1 potencial** em listagens que mapeiam relações (`operations`, `matching`) | `*.service.ts` listagens | Usar `include`/`select` agregando `_count` e evitar loops com query por item; revisar com `prisma` log de queries |
| B5 | 🟡 | 🔨 | **Preços de carbono ilustrativos** retornados pela API | `carbon-credits.service.ts:513` | Integrar Verra/Gold Standard/B3 ou cache de fonte real; marcar claramente "referência" no front |
| B6 | 🟡 | 🔨 | **Observabilidade fraca**: logging interceptor existe, mas sem APM/error tracking | global | Adicionar **Sentry** (erros) + **OpenTelemetry**/Logflare (traces) — essencial para vender a milhares |
| B7 | 🟢 | ⚡ | Paginação não padronizada entre endpoints (`page/perPage` vs outros) | controllers | Criar `PaginationDto` reutilizável e envelope `{ data, meta }` consistente |
| B8 | 🟢 | 🔨 | Sem **filas/jobs** para tarefas pesadas (e-mail, geração de PDF, score em lote) | infra | Adicionar **BullMQ + Redis** para e-mails, webhooks e scoring assíncrono |
| B9 | 🟢 | ⚡ | Sem **health check de dependências** (DB, Redis) detalhado | `modules/health` | `@nestjs/terminus` com indicadores de DB/disk/memória |

### 3.3 Exemplo — idempotência de webhook (B1)

```typescript
// subscriptions/asaas.service.ts
async handleWebhook(event: AsaasEvent) {
  const exists = await this.prisma.webhookEvent.findUnique({
    where: { provider_externalId: { provider: 'ASAAS', externalId: event.id } },
  });
  if (exists) {
    this.logger.warn(`Evento Asaas ${event.id} já processado — ignorando (idempotência)`);
    return { ok: true, deduped: true };
  }
  // ... processa ...
  await this.prisma.webhookEvent.create({
    data: { provider: 'ASAAS', externalId: event.id, type: event.event, payload: event as any },
  });
}
```
Requer novo modelo `WebhookEvent` no schema com `@@unique([provider, externalId])`.

### 3.4 Exemplo — não vazar campos sensíveis (B3)

```typescript
// users/entities/user.entity.ts
import { Exclude } from 'class-transformer';
export class UserEntity {
  id: string;
  email: string;
  @Exclude() passwordHash: string;   // nunca serializado
  constructor(p: Partial<UserEntity>) { Object.assign(this, p); }
}
// main.ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

---

## 4. Banco de Dados / Prisma (Nota 8.0)

### 4.1 Pontos fortes ✅
- **30 modelos** cobrindo o domínio completo (User, Company, ProducerProfile, FinancialProfile, OperationRequest, Document, RiskScore, PartnerInstitution, MatchResult, Proposal, Contract, Subscription, Commission, AuditLog, Notification, + módulo de Carbono com 5 modelos + Quantovale/CPR).
- **56 `@@index`/`@@unique`** — cobertura de índices muito boa para o estágio.
- **Soft delete** (`deletedAt`) padronizado.
- **Audit log** com IP, user-agent e diff.
- **LGPD**: `consentLgpd` + `consentLgpdAt` em `User`.
- Relações com `onDelete: Cascade` corretas.

### 4.2 Achados

| # | Sev | Achado | Recomendação |
|---|---|---|---|
| D1 | 🟡 | Soft-delete sem **filtro global** automático | Adotar Prisma Client Extension (`$extends`) para aplicar `deletedAt: null` por padrão, evitando esquecer o filtro em queries |
| D2 | 🟡 | Valores monetários — confirmar uso de `Decimal` (não `Float`) | Garantir `Decimal @db.Decimal(15,2)` em todos os campos R$ (precisão financeira) |
| D3 | 🟢 | Sem **migrations versionadas** evidentes (uso de `db push`?) | Migrar para `prisma migrate` com histórico versionado — obrigatório para produção multi-cliente |
| D4 | 🟢 | Índices compostos para queries de listagem | Revisar `@@index([status, deletedAt, createdAt])` nas tabelas mais consultadas (OperationRequest, MatchResult) |
| D5 | 🟢 | Sem particionamento/arquivamento para `AuditLog`/`Notification` | Em escala, mover histórico antigo para cold storage |

---

## 5. Segurança (Nota 7.5 — já forte)

### 5.1 Forte ✅
CSP, Helmet, CORS por env, JWT global guard + `@Public()`, RolesGuard + `@Roles()`, refresh rotation, throttle por rota, validação estrita, middleware Edge com verificação real (`jose`), audit log, LGPD, validadores CPF/CNPJ, boot-guard de `JWT_SECRET`.

### 5.2 Achados de hardening

| # | Sev | Achado | Recomendação |
|---|---|---|---|
| S1 | 🟠 | Webhook sem HMAC/idempotência (ver B1/B2) | Replay protection |
| S2 | 🟠 | Tokens em **cookie `accessToken` legível pelo middleware** — confirmar `httpOnly`, `secure`, `sameSite=strict` | Garantir flags; access token curto (15 min) + refresh httpOnly |
| S3 | 🟡 | **Proteção só em `/dashboard/admin`** no Edge; demais rotas dependem de checagem client-side | Aceitável em SPA, mas dados sensíveis devem ser sempre validados na API (já são via guard) — documentar |
| S4 | 🟡 | Sem **detecção de reuso de refresh token** (token theft) | Ao detectar token revogado sendo reusado, revogar toda a família de tokens do usuário |
| S5 | 🟡 | Uploads — validar **tipo MIME real, tamanho e antivírus** | `file-type` + limite + scan (ClamAV) antes de armazenar |
| S6 | 🟢 | Sem **2FA/MFA** | Oferecer TOTP para contas institucionais (exigência de clientes enterprise) |
| S7 | 🟢 | Secrets — garantir que `.env.local` e `.env` nunca versionados | Confirmar `.gitignore`; usar secret manager do Railway |
| S8 | 🟢 | Sem **rate limit distribuído** (Throttler é em memória) | Em multi-instância, usar `ThrottlerStorageRedis` |

> **SSRF/SQLi/XSS:** Prisma parametriza queries (SQLi mitigado); React escapa por padrão (XSS mitigado); não há `dangerouslySetInnerHTML` aparente. CSRF mitigado por JWT em header (não cookie de sessão clássico) — mas se usar cookie para auth, **adicionar proteção CSRF**.

---

## 6. Frontend / Next.js (Nota 7.0)

### 6.1 Bom ✅
- App Router organizado: rotas públicas (`/`, `/planos`, `/como-funciona`, `/sobre`, `/blog`, `/contato`, `/parceiros`, `/carreiras`, `/legal`), auth (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`), `/dashboard/*` por role.
- **Design system embrionário** em `globals.css` (`.btn-primary`, `.card`, `.input`, `.label`, `.section-title`) + Tailwind config com paleta `brand` derivada da logo real.
- Dark mode com `ThemeToggle` + `theme-context`.
- `auth-context`, `preview-context` (admin testa cada role sem logar — ótimo para QA/demo).
- Dashboards por role: `DashboardStart/Pro/Cooperative/Corporate` — **todos consomem API real** (`api.get('/operations')`, `/subscriptions/me`).
- Libs boas: `react-hook-form` + `zod` + `@hookform/resolvers`, `framer-motion`, `recharts`, `react-hot-toast`.

### 6.2 Achados

| # | Sev | Esf | Achado | Arquivo | Recomendação |
|---|---|---|---|---|---|
| F1 | 🟠 | 🏗️ | **Zero testes no web** (`test` script ausente) | `apps/web` | Vitest + Testing Library + Playwright (e2e dos fluxos críticos: cadastro→score→match) |
| F2 | 🟠 | 🔨 | **Tudo client-side** (`'use client'` em quase tudo) — perde SSR/RSC, SEO e performance | landing + dashboards | Tornar landing em **Server Components** (Hero, Plans, FAQ não precisam de JS no cliente) |
| F3 | 🟡 | 🔨 | Re-render não otimizado (sem `memo`/`useMemo` em listas, contexts amplos) | dashboards | Memoizar listas, dividir contexts, `useCallback` em handlers |
| F4 | 🟡 | ⚡ | **OG image quebrada**: metadata aponta `/og-image.png`, mas só existe `og-image.svg` | `layout.tsx` + `public/` | Gerar `og-image.png` 1200×630 (ver §8) |
| F5 | 🟡 | 🔨 | Sem **error boundary granular** / estados de erro ricos por seção | dashboards | `error.tsx` por rota + retry; já existe global |
| F6 | 🟡 | 🔨 | **Acessibilidade** parcial: faltam `aria-label` em ícones-botão, foco visível consistente, contraste em texto cinza claro | UI components | Auditoria WCAG AA (ver §10) |
| F7 | 🟢 | ⚡ | SVGs inline repetidos no `Hero.tsx` (ArrowSVG, TrendSVG...) | `Hero.tsx` | Já usam `lucide-react` — padronizar tudo em lucide e remover duplicados |
| F8 | 🟢 | 🔨 | Sem **skeletons** consistentes; alguns loadings são spinner/branco | dashboards | Skeleton screens padronizados (percebido como mais rápido) |
| F9 | 🟢 | ⚡ | `react-hot-toast` ok, mas sem padrão de feedback (sucesso/erro/undo) | global | Criar wrapper `notify.success/error` com ações |

### 6.3 Duplicação / código morto
- **SVGs inline** em `Hero.tsx` duplicam ícones que já existem em `lucide-react` → remover.
- Constantes de configuração (`STATUSES`, `PLANS`, `SCORE_FACTORS`, `OPERATION_TYPES`, `CROPS`, `STATES`) repetidas em várias páginas → centralizar em `lib/constants.ts` ou em `@conectcampo/types`.
- `PREVIEW_OPTIONS` definido em `dashboard/page.tsx` — mover para constante compartilhada (também usado na barra de preview).

---

## 7. Mocks & Dados Simulados — Mapa Completo

> **Boa notícia:** a maioria dos dashboards **já consome a API real** (23/23 páginas fazem chamadas a `api`). Os "mocks" encontrados são em grande parte **constantes de configuração legítimas** (opções de select, passos de onboarding) — não dados falsos. Abaixo, o que **realmente precisa virar dado real**:

| # | Onde | Tipo | É problema? | Como tornar real |
|---|---|---|---|---|
| M1 | `carbon-credits.service.ts:513` `getMarketPrices()` | Preços de carbono ilustrativos | ⚠️ **Sim** — exibido como referência | Integrar Verra/Gold Standard/B3; cache diário; rotular "referência de mercado" |
| M2 | `carbon-credits/mercado/page.tsx` `MARKET_INFO`, `RESOURCES` | Conteúdo estático | Parcial | Conteúdo institucional pode ficar; preços via API M1 |
| M3 | `DashboardStart.tsx:105` `pendencies` | Lista de pendências hardcoded | ⚠️ **Sim** (citado no audit antigo) | Endpoint `/operations/pending-actions` por usuário |
| M4 | Cards "Pendências" no admin | Estático | ⚠️ Sim | Buscar contagem real da API |
| M5 | `operations/new/page.tsx` `OPERATION_TYPES`, `CROPS`, `STEPS` | Config de formulário | ✅ Não (config legítima) | Opcional: mover para enums compartilhados |
| M6 | `subscription/page.tsx` `PLANS` | Planos hardcoded no front | 🟡 Parcial | Servir planos/preços via API `/subscriptions/plans` (fonte única, evita divergência com Asaas) |
| M7 | `scoring/page.tsx` `SCORE_FACTORS` | Labels dos fatores | ✅ Não | Já bate com os pesos do backend; idealmente vir do backend |
| M8 | Landing — números "48h", "Multi-parceiros", "100% digital" | Marketing copy | ✅ Não (copy) | Quando houver tração, trocar por métricas reais ("R$ X intermediados") |
| M9 | `sobre/page.tsx`, `Footer.tsx` | "sample" em texto | ✅ Não | Falso positivo do grep |

**Resumo:** os mocks **críticos a eliminar** são M1, M3, M4 e idealmente M6. O resto é configuração/copy.

### Dados reais ainda ausentes (infra a construir)
- **Realtime/WebSockets:** notificações e status de propostas hoje são pull. Adicionar WebSocket (Socket.io/Nest Gateway) para "nova proposta", "documento aprovado".
- **Background jobs:** e-mails, geração de contrato/PDF, scoring em lote → BullMQ.
- **Cache:** Redis para market-prices, planos, e listagens quentes.
- **Integrações reais:** bureaus de crédito (Serasa/Boa Vista), Receita (CNPJ), bureaus agro (clima/safra), assinatura eletrônica (Clicksign/D4Sign) para CPR/contratos.

---

## 8. Favicon & Identidade Visual

**Diagnóstico:** o favicon atual (`favicon.ico`, 6KB; `favicon-16/32`, `apple-touch-icon`, `android-chrome`) deriva da logo, mas — como você notou — é **quadrado e pouco distintivo** em tamanhos pequenos. Em 16×16 a logo "ConectCampo" não lê.

**Conceito recomendado — "A folha-rota" (símbolo, não logo reduzida):**
- Um **monograma "C"** que sugere ao mesmo tempo uma **folha** e um **ponto de conexão/nó** (marketplace), usando os verdes da marca (`#008c3c` → `#003c28`) com o ponto **dourado** (`#b48c3c`) como acento — a identidade já tem esse dourado.
- **Minimalista, geométrico, legível em 16px**, formas cheias (não traço fino, que some).

**Entregáveis do pacote de ícones:**
- `icon.svg` (mestre, escalável)
- `favicon.ico` (16/32/48 multi-res)
- `apple-touch-icon.png` (180×180, fundo sólido verde — iOS não respeita transparência)
- `android-chrome-192/512.png` + `maskable` (safe zone para PWA)
- `mstile-150.png` + `browserconfig.xml` (Windows)
- Versão **clara** (símbolo verde em fundo claro) e **escura** (símbolo claro/dourado em fundo verde-escuro)
- `og-image.png` 1200×630 (corrige F4)

> Posso gerar o conjunto completo de ícones (SVG + PNGs + ico) na próxima etapa se você aprovar o conceito.

---

## 9. Performance (Nota 6.5)

| # | Sev | Achado | Recomendação |
|---|---|---|---|
| P1 | 🟠 | **`logo-icon.png` = 353KB** servido como ícone | Comprimir/usar SVG (`logo-icon.svg` já existe) — economia imediata |
| P2 | 🟠 | Landing toda client-side → JS grande no first load | Server Components nas seções estáticas (ver F2); reduz TBT/INP |
| P3 | 🟡 | Imagens sem `next/image` em todos os pontos | Padronizar `next/image` (lazy, AVIF/WebP, sizes) |
| P4 | 🟡 | **Sem medição** (Lighthouse CI / Web Vitals) | Adicionar `@vercel/speed-insights` ou Web Vitals → RUM |
| P5 | 🟡 | `recharts` é pesado | Lazy-load gráficos (`next/dynamic`, `ssr:false`) só quando visíveis |
| P6 | 🟢 | Fontes Google (Inter) via `next/font` | ✅ Já otimizado (self-host automático) |
| P7 | 🟢 | Sem `prefetch` estratégico de rotas de conversão | Prefetch de `/register` no hover dos CTAs |

**Metas-alvo (mobile, campo com 4G):** LCP < 2.5s, INP < 200ms, CLS < 0.1. Hoje, sem medição, é cego — **instrumentar é prioridade**.

---

## 10. Acessibilidade (WCAG 2.1 AA)

| # | Sev | Achado | Correção |
|---|---|---|---|
| AC1 | 🟠 | Botões só com ícone sem `aria-label` | Adicionar rótulos acessíveis |
| AC2 | 🟡 | Contraste de texto cinza-claro (`text-gray-400`) sobre branco < 4.5:1 | Subir para `gray-600`+ |
| AC3 | 🟡 | Foco visível inconsistente fora dos botões do design system | `:focus-visible` global com anel da marca |
| AC4 | 🟡 | Simulador de crédito (sliders) — navegação por teclado e `aria-valuenow` | Garantir ARIA nos ranges |
| AC5 | 🟢 | Imagens decorativas vs informativas — `alt` correto | Revisar `alt`/`aria-hidden` |
| AC6 | 🟢 | Dark mode — revalidar contraste em ambos os temas | Testar com axe |

Público rural/idoso → **acessibilidade é também conversão**. Recomendo `eslint-plugin-jsx-a11y` + axe no CI.

---

## 11. SEO (Nota 4.5 — maior gap técnico)

| # | Sev | Achado | Correção |
|---|---|---|---|
| SEO1 | 🔴 | **Sem `robots.txt`** (confirmado: retorna vazio em produção) | `app/robots.ts` |
| SEO2 | 🔴 | **Sem `sitemap.xml`** | `app/sitemap.ts` (gerar de rotas + blog) |
| SEO3 | 🟠 | **Sem JSON-LD / Schema.org** | Adicionar `Organization`, `FinancialService`, `FAQPage`, `Product` (planos) |
| SEO4 | 🟠 | **OG image quebrada** (`.png` referenciado, só existe `.svg`) | Gerar PNG 1200×630 |
| SEO5 | 🟡 | Sem `canonical` explícito por página | Definir `alternates.canonical` |
| SEO6 | 🟡 | Blog existe mas (a validar) sem conteúdo indexável real | Estratégia de conteúdo (crédito rural, CPR, FIDC...) — tráfego orgânico de alto valor |
| SEO7 | 🟢 | Metadata base, OG e Twitter | ✅ Bem feitos em `layout.tsx` |

### Exemplos prontos

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] },
    sitemap: 'https://conectcampo.digital/sitemap.xml',
  };
}
```
```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://conectcampo.digital';
  const routes = ['', '/planos', '/como-funciona', '/sobre', '/parceiros', '/contato', '/carreiras', '/blog'];
  return routes.map((r) => ({ url: `${base}${r}`, lastModified: new Date(), changeFrequency: 'weekly', priority: r === '' ? 1 : 0.7 }));
}
```
```tsx
// JSON-LD (FinancialService) na home
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context":"https://schema.org","@type":"FinancialService",
  "name":"ConectCampo","url":"https://conectcampo.digital",
  "description":"Marketplace de crédito agro que conecta produtores rurais a bancos, FIDCs e securitizadoras.",
  "areaServed":"BR"
})}} />
```

---

## 12. UX & Conversão (Nota 6.0)

### 12.1 Pontos fortes da home atual
- **Simulador de crédito interativo** na hero — excelente gancho de conversão (raro nos concorrentes).
- Segmentação clara por **persona** (tomador vs financiador) e por **porte** (Faixa A–D).
- Seção de segurança bem articulada (LGPD, criptografia, RBAC).
- FAQ presente; planos transparentes.

### 12.2 Atritos e oportunidades

| # | Sev | Atrito | Solução |
|---|---|---|---|
| UX1 | 🟠 | **Zero prova social** (sem logos de parceiros, depoimentos, números reais, casos) | Maior alavanca de credibilidade — ver §13/§16 |
| UX2 | 🟠 | CTA duplo "Buscar Crédito / Oferecer Crédito" sem destino claro de baixo atrito | Levar a um **quiz/onboarding de 3 passos** antes de pedir cadastro |
| UX3 | 🟡 | Cadastro provavelmente pede muito de uma vez | **Onboarding progressivo**: e-mail → simulação → completa perfil depois |
| UX4 | 🟡 | Simulador não captura lead | Após simular, "Receba propostas reais" → e-mail (lead) |
| UX5 | 🟡 | Sem **status público** / trust badges (uptime, "regulado", parceiros) | Selo de segurança e, futuramente, status page |
| UX6 | 🟢 | Muitos cliques para ver planos | Âncora direta + comparativo |
| UX7 | 🟢 | Sem chat/WhatsApp para dúvida no momento da decisão | Botão WhatsApp/Intercom |

**Princípio:** o produto **pede cadastro cedo demais** para o valor entregue. Inverter: **entregar valor (simulação, match preview) antes de pedir dados** aumenta conversão e retenção.

---

## 13. Análise de Design (Nota 5.5 → alvo 9+)

### 13.1 Diagnóstico honesto
O design atual é **competente e limpo**, mas "genérico de template Tailwind": cards com `rounded-xl + shadow-sm`, muito verde chapado, hierarquia tipográfica plana, pouca profundidade, ausência de microinterações memoráveis. Não é feio — é **esquecível**. Stripe/Linear/Vercel se destacam por: **tipografia com escala dramática, espaçamento generoso, profundidade sutil (glows, gradientes mesh), microinterações e um "hero" com personalidade**.

### 13.2 O que separa "OK" de "premium"

| Dimensão | Hoje | Premium (alvo) |
|---|---|---|
| Tipografia | Inter, escala plana | Escala dramática (display 56–72px), pesos contrastantes, `tracking` ajustado |
| Cor | Verde chapado | Verde da marca + **gradientes mesh sutis**, dark premium, dourado como acento raro |
| Profundidade | `shadow-sm` | Sombras em camadas, glows suaves, glass sutil |
| Espaçamento | Adequado | Mais "ar" (seções 96–128px), ritmo vertical consistente |
| Movimento | Framer básico | Scroll-reveal, parallax leve, números animados, hover states ricos |
| Ilustração | Ícones lucide | Ilustrações/mockups de produto reais, "device frames", dashboards em destaque |
| Prova | Ausente | Logos, métricas animadas, depoimentos com foto, casos |

### 13.3 Componentes a elevar
- **Botões:** estados hover/active/loading com micro-movimento; CTA primário com leve gradiente + glow no hover.
- **Cards:** borda + sombra em camadas + hover lift; cards de plano com destaque real no "Mais Popular".
- **Inputs/Forms:** labels flutuantes, validação inline amigável, máscara de CPF/CNPJ/moeda.
- **Tabelas (dashboards):** densidade ajustável, sticky header, ordenação, empty states ilustrados, row hover.
- **Navbar:** sticky com blur ao rolar, indicador de seção ativa.
- **Sidebar (dashboard):** colapsável, ícones + labels, grupos, estado ativo claro.

> Os protótipos entregues (`redesign-home.html` e `redesign-dashboard.html`) materializam isso mantendo **as cores reais da marca**.

---

## 14. Redesign da Home — Proposta

Entregue como protótipo navegável (`redesign-home.html`). Estrutura proposta:

1. **Navbar premium** sticky com blur, logo, navegação, CTA duplo (Entrar / Começar).
2. **Hero** com headline de alto impacto + subheadline + **dois CTAs** + **simulador interativo** em card flutuante com profundidade + faixa de confiança ("Instituições entram grátis · PIX/cartão/boleto").
3. **Barra de prova social** (logos de bancos/cooperativas/FIDCs — placeholders até ter parceiros reais).
4. **Métricas animadas** (R$ intermediados, produtores, instituições, prazo médio) — `AnimatedCounter`.
5. **Para quem é** (tomador × financiador) com cards ricos.
6. **Como funciona** em 5 passos com timeline visual.
7. **Faixas A–D** (porte) em grid premium.
8. **Showcase do produto** (mockup de dashboard em device frame).
9. **Segurança** com selos.
10. **Planos** com destaque real do popular + toggle mensal/anual.
11. **Depoimentos** (placeholders) com foto/cargo.
12. **FAQ** em accordion.
13. **CTA final** com gradiente mesh.
14. **Footer** completo.

**Copy da hero (sugestão de upgrade):**
- Headline: *"O crédito que o agro merece — sem burocracia, sem balcão."*
- Subheadline: *"Conectamos sua operação a bancos, cooperativas, FIDCs e ao mercado de capitais. Pré-análise em 48h, 100% digital."*
- CTA: *"Simular meu crédito"* (primário) · *"Sou instituição financeira"* (secundário)

**Princípios mantidos:** cores reais (`#008c3c`, `#003c28`, dourado `#b48c3c`), tom de confiança bancária + leveza do agro.

---

## 15. Redesign dos Dashboards — Proposta

Entregue como protótipo (`redesign-dashboard.html`). Melhorias:

- **Sidebar** colapsável com grupos (Operações, Crédito, Carbono, Conta), estado ativo claro, perfil no rodapé.
- **Topbar** com busca global, notificações (badge), troca de tema, avatar/menu.
- **KPIs** em cards com ícone, valor grande, **delta vs período** (↑/↓), sparkline.
- **Gráficos** (recharts) com paleta da marca, tooltip custom, lazy-load.
- **Tabela de operações** premium: status badges, ordenação, filtros chip, empty state ilustrado, ações por linha.
- **Hierarquia**: título + subtítulo + ações no topo; espaçamento consistente (grid 8px).
- **Responsivo**: sidebar vira drawer no mobile; KPIs empilham.
- **Microinterações**: hover lift nos cards, skeleton no load, toasts de feedback.

---

## 16. Concorrência & Posicionamento

Principais players do crédito agro digital no Brasil: **Agrolend, Nagro, TerraMagna, Traive, A de Agro, DuAgro, Bart Digital** (+ braços de Syngenta).

| Player | Modelo | Força | ConectCampo tem? |
|---|---|---|---|
| **Agrolend** | Banco digital do agro, crédito via revendas/cooperativas | Originação via canais, funding robusto (rodadas R$80M+) | Modelo diferente (marketplace multi-financiador) ✅ diferencial |
| **Nagro** | Fintech regulada BACEN, direto ao produtor | Regulação, app 100k+ downloads, R$700M+ operados | ❌ Não regulado (é marketplace) — ok, mas comunicar bem |
| **TerraMagna** | Crédito + recebíveis + Fiagro, foco distribuidores | Dados de monitoramento de safra/garantia | ❌ Falta monitoramento de garantia por satélite |
| **Traive** | Plataforma de crédito + risco com IA | Engine de risco/IA, dados | Parcial (scoring próprio) — falta IA avançada |
| **Bart Digital** | Infra de CPR digital/registro | CPR eletrônica, cartório | Parcial (módulo CPR) — aprofundar |

### O que os concorrentes têm e o ConectCampo ainda NÃO tem
1. **Monitoramento de garantia/safra por satélite** (NDVI, área plantada) — TerraMagna.
2. **Registro/assinatura eletrônica de CPR integrada a cartório** — Bart Digital.
3. **Engine de risco com IA/ML** treinado em dados reais — Traive.
4. **Integração com bureaus** (Serasa, Receita) e **Open Finance agro**.
5. **App mobile nativo** — Nagro (campo tem conectividade ruim; PWA/app importa).
6. **Regulação/funding** comunicados como prova de credibilidade.
7. **Antecipação de recebíveis** como produto — Nagro/TerraMagna.

### Diferencial defensável do ConectCampo
**Marketplace multi-financiador neutro** (não é credor — conecta a vários). Isso é raro: a maioria é credora única. Vale **posicionar como "o lugar onde o produtor compara e escolhe", não onde pega emprestado de um só**. É o ângulo "Stripe/Booking do crédito agro".

---

## 17. Novas Funcionalidades (priorizadas)

### P0 — Essencial (destrava produto/credibilidade)
| Feature | Benefício | Complexidade | Impacto | ROI |
|---|---|---|---|---|
| Prova social real (logos, métricas, casos) | Credibilidade/conversão | Baixa | ⭐⭐⭐⭐⭐ | Altíssimo |
| robots/sitemap/JSON-LD + OG fix | Indexação/tráfego | Baixa | ⭐⭐⭐⭐ | Altíssimo |
| Idempotência + HMAC no webhook | Integridade financeira | Média | ⭐⭐⭐⭐ | Alto |
| Sentry + Web Vitals (observabilidade) | Confiabilidade | Baixa | ⭐⭐⭐⭐ | Alto |
| Testes e2e dos fluxos críticos | Não quebrar em escala | Média | ⭐⭐⭐⭐ | Alto |

### P1 — Muito importante
| Feature | Benefício | Compl. | Impacto |
|---|---|---|---|
| Onboarding progressivo + captura de lead no simulador | Conversão/retenção | Média | ⭐⭐⭐⭐⭐ |
| Integração bureaus (Serasa/Receita) | Score real, antifraude | Alta | ⭐⭐⭐⭐ |
| Assinatura eletrônica CPR/contrato (Clicksign) | Fecha o ciclo digital | Média | ⭐⭐⭐⭐ |
| Notificações realtime (WebSocket) | Engajamento | Média | ⭐⭐⭐ |
| Filas (BullMQ) p/ e-mail/PDF/score | Escala/estabilidade | Média | ⭐⭐⭐ |

### P2 — Melhorias
- App PWA instalável (offline-friendly p/ campo), comparador de propostas lado a lado, central de documentos com OCR, multi-idioma, modo "consultor" (white-label p/ cooperativas).

### P3 — Futuro
- Marketplace de seguros agro, antecipação de recebíveis, Open Finance agro, monitoramento de safra por satélite, tokenização de CPR.

---

## 18. Inteligência Artificial (recursos sugeridos)

1. **Copiloto ConectCampo** (chat) — responde sobre crédito, status, "qual o melhor plano para mim", usa RAG sobre os dados do usuário.
2. **Explicação do Score em linguagem natural** — "seu score subiria 80 pts se a cobertura de garantia passar de 60% para 100%".
3. **Recomendação de parceiros** com ranking explicável (já há matching; adicionar explicação e aprendizado).
4. **Preenchimento assistido de cadastro** — extrair dados de documentos (CNPJ/CPR) com OCR + LLM.
5. **Alertas inteligentes** — "taxa média de mercado caiu, vale refinanciar"; "documento X vence em 7 dias".
6. **Resumo automático de propostas** — comparar 5 propostas e destacar a melhor por critério.
7. **Previsão de aprovação** — probabilidade por parceiro antes de enviar.
8. **Detecção de fraude/anomalia** em uploads e cadastros.

> Arquitetura sugerida: serviço `ai` no Nest chamando provider (Claude/OpenAI) com guardrails, function-calling para ler dados via os services existentes, e cache de respostas. Começar por (2) e (1) — alto valor percebido, baixo risco.

---

## 19. Visão de Investidor (due diligence)

### O que **impediria** um investimento hoje
- **Falta de tração/prova provável** (sem métricas reais expostas): investidor quer GMV intermediado, nº de operações fechadas, parceiros ativos, take-rate.
- **Sem moat de dados** ainda (scoring é regras, não ML treinado em performance real de crédito).
- **Risco regulatório** não endereçado publicamente (correspondente bancário? parceria com IF reguladas?).
- **Dependência de poucos integradores** de pagamento; sem integrações de crédito reais comprovadas.
- **Qualidade**: ausência de testes no front e observabilidade fraca → risco operacional em escala.

### O que **aumentaria muito o valuation**
- **Dados proprietários** de performance de crédito (inadimplência por perfil) → moat real.
- **Take-rate comprovado** + receita recorrente (SaaS) crescente.
- **Parcerias com IFs** assinadas e ativas (prova de oferta).
- **Engine de risco com IA** validada.
- **Métricas de retenção** SaaS saudáveis (NRR, churn baixo).
- **Compliance/regulação** clara.

**Resumo:** a engenharia **não é o gargalo do valuation** — o gargalo é **tração, dados e prova**. Tecnicamente já está investível; falta a camada de negócio comprovada e o polimento que transmite "produto sério".

---

## 20. Roadmap de Execução (9 Fases)

> Legenda: Prioridade P0–P3 · Dificuldade ⚡/🔨/🏗️ · Impacto ⭐(1)–⭐⭐⭐⭐⭐(5)

### Fase 1 — Correções críticas (1–2 semanas)
| Item | Prio | Dif | Imp | Tempo | Arquivos | Justificativa |
|---|---|---|---|---|---|---|
| `robots.ts` + `sitemap.ts` | P0 | ⚡ | 4 | 0.5d | `app/robots.ts`, `app/sitemap.ts` | Indexação inexistente hoje |
| Gerar `og-image.png` 1200×630 | P0 | ⚡ | 3 | 0.5d | `public/og-image.png`, `layout.tsx` | OG quebrado (compartilhamento sem imagem) |
| Idempotência webhook Asaas | P0 | 🔨 | 4 | 2d | `subscriptions/asaas.service.ts`, `schema.prisma` (WebhookEvent) | Evita dupla cobrança/estado |
| HMAC no webhook | P0 | 🔨 | 4 | 1d | `modules/webhooks` | Replay protection |
| Sentry + Web Vitals | P0 | ⚡ | 4 | 1d | `main.ts`, `app/layout.tsx` | Cego sem observabilidade |
| Arquivar `AUDITORIA.md` antigo | P0 | ⚡ | 1 | 0.1d | `AUDITORIA.md` | Evitar confusão |

### Fase 2 — Melhorias importantes (2–3 semanas)
| Item | Prio | Dif | Imp | Tempo | Arquivos |
|---|---|---|---|---|---|
| Eliminar mocks M1/M3/M4/M6 (dados reais) | P1 | 🔨 | 4 | 3d | `carbon-credits.service.ts`, `DashboardStart.tsx`, admin, `/subscriptions/plans` |
| `ClassSerializerInterceptor` + entities (não vazar campos) | P1 | ⚡ | 3 | 1d | `main.ts`, `*/entities` |
| `PaginationDto` + envelope `{data,meta}` | P1 | 🔨 | 3 | 2d | controllers |
| Centralizar constantes duplicadas | P1 | ⚡ | 2 | 1d | `lib/constants.ts`, `@conectcampo/types` |
| Migrations versionadas (`prisma migrate`) | P1 | 🔨 | 3 | 1d | `prisma/migrations` |

### Fase 3 — Redesign UX/UI (3–5 semanas)
| Item | Prio | Dif | Imp | Tempo | Arquivos |
|---|---|---|---|---|---|
| Implementar nova Home (protótipo entregue) | P1 | 🏗️ | 5 | 2sem | `components/landing/*`, `app/page.tsx` |
| Redesign dashboards (protótipo entregue) | P1 | 🏗️ | 4 | 2sem | `components/dashboard/*` |
| Design system formal (tokens, Storybook) | P1 | 🔨 | 4 | 1sem | `globals.css`, `tailwind.config`, novo `packages/ui` |
| Onboarding progressivo + lead no simulador | P1 | 🔨 | 5 | 4d | `register`, `CreditSimulator.tsx` |
| Novo favicon/pacote de ícones | P1 | ⚡ | 3 | 1d | `public/*` |

### Fase 4 — Performance (1–2 semanas)
| Item | Prio | Dif | Imp | Arquivos |
|---|---|---|---|---|
| Landing em Server Components | P1 | 🔨 | 4 | `components/landing/*` |
| `next/image` em tudo + comprimir `logo-icon.png` | P1 | ⚡ | 3 | `public/*`, componentes |
| Lazy-load recharts | P2 | ⚡ | 2 | dashboards |
| Lighthouse CI no pipeline | P2 | ⚡ | 3 | `.github/workflows` |

### Fase 5 — Segurança (1–2 semanas)
| Item | Prio | Dif | Imp |
|---|---|---|---|
| Flags de cookie (httpOnly/secure/sameSite) auditadas | P0 | ⚡ | 4 |
| Detecção de reuso de refresh token (revogar família) | P1 | 🔨 | 3 |
| Validação de upload (MIME real + tamanho + scan) | P1 | 🔨 | 3 |
| Throttler distribuído (Redis) | P2 | 🔨 | 2 |
| 2FA/TOTP para contas institucionais | P2 | 🔨 | 3 |

### Fase 6 — Escalabilidade (2–3 semanas)
| Item | Prio | Dif | Imp |
|---|---|---|---|
| Redis (cache + throttle + sessões) | P1 | 🔨 | 3 |
| BullMQ (e-mail, PDF, score em lote) | P1 | 🔨 | 3 |
| WebSocket/Gateway (notificações realtime) | P1 | 🔨 | 3 |
| Soft-delete global via Prisma extension | P2 | ⚡ | 2 |
| Índices compostos + revisão de N+1 | P1 | 🔨 | 3 |

### Fase 7 — Funcionalidades Premium (4–8 semanas)
| Item | Prio | Dif | Imp |
|---|---|---|---|
| Assinatura eletrônica CPR/contrato (Clicksign/D4Sign) | P1 | 🔨 | 4 |
| Integração bureaus (Serasa/Receita) | P1 | 🏗️ | 4 |
| Comparador de propostas lado a lado | P1 | 🔨 | 4 |
| PWA instalável | P2 | 🔨 | 3 |
| Antecipação de recebíveis | P3 | 🏗️ | 4 |

### Fase 8 — IA (4–8 semanas)
| Item | Prio | Dif | Imp |
|---|---|---|---|
| Explicação do score em linguagem natural | P1 | 🔨 | 4 |
| Copiloto ConectCampo (RAG) | P1 | 🏗️ | 5 |
| Preenchimento assistido (OCR+LLM) | P2 | 🏗️ | 4 |
| Alertas inteligentes | P2 | 🔨 | 3 |
| Previsão de aprovação por parceiro | P2 | 🏗️ | 4 |

### Fase 9 — Diferenciais competitivos (contínuo)
| Item | Prio | Dif | Imp |
|---|---|---|---|
| Moat de dados (performance de crédito → ML) | P1 | 🏗️ | 5 |
| Monitoramento de garantia/safra por satélite | P3 | 🏗️ | 4 |
| Open Finance agro / parcerias com IFs | P2 | 🏗️ | 5 |
| Marketplace de seguros agro | P3 | 🏗️ | 4 |
| App mobile nativo | P3 | 🏗️ | 3 |

---

## 21. Top 10 ações com maior ROI (faça primeiro)

1. **Prova social na home** (logos, métricas, depoimentos) — credibilidade instantânea.
2. **robots.txt + sitemap.xml + JSON-LD + OG fix** — meio dia, destrava SEO.
3. **Implementar a nova Home** (protótipo entregue) — percepção de "SaaS de milhões".
4. **Sentry + Web Vitals** — parar de operar às cegas.
5. **Idempotência + HMAC no webhook** — integridade financeira.
6. **Onboarding progressivo + lead no simulador** — conversão.
7. **Redesign dos dashboards** — retenção e percepção de valor.
8. **Eliminar mocks M1/M3/M4** — produto "de verdade".
9. **Explicação do score por IA** — diferencial barato e marcante.
10. **Testes e2e dos fluxos críticos** — escalar sem medo.

---

*Relatório gerado por auditoria assistida sobre o código-fonte (commit `37b4bcf`) e o site em produção. Os protótipos `redesign-home.html` e `redesign-dashboard.html` acompanham este documento, mantendo as cores reais da marca.*
