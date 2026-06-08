# 🔍 Auditoria Geral — ConectCampo
**Data:** 08/06/2026 | **Auditor:** Claude (Cowork)

---

## ✅ O que está OK

### Backend (NestJS)
- **Segurança HTTP:** Helmet ativado em todas as requisições
- **CORS:** Configurado via variável `CORS_ORIGIN`, suporte a múltiplas origens
- **Rate limiting:** ThrottlerModule (60 req/min global) + APP_GUARD registrado
- **Autenticação:** JWT global via `JwtAuthGuard` como APP_GUARD + `@Public()` decorator para rotas públicas
- **Autorização:** `RolesGuard` + `@Roles()` por endpoint — granularidade correta
- **Validação:** `ValidationPipe` com `whitelist: true` + `forbidNonWhitelisted: true` em todas as entradas
- **Webhook Asaas:** Validação de token (`asaas-access-token`) antes de processar
- **CPF/CNPJ:** Validadores customizados (`IsCPF`, `IsCNPJ`) no DTO de registro
- **Soft delete:** Padrão `deletedAt` em todos os modelos principais
- **Audit log:** Módulo `AuditLog` com IP, user-agent e diff de valores
- **Prisma schema:** Todos os índices necessários definidos; relações com `onDelete: Cascade` corretas
- **LGPD:** Campo `consentLgpd` + `consentLgpdAt` no modelo `User`
- **JWT_SECRET check:** Bootstrap recusa start se JWT_SECRET não estiver definido

### Frontend (Next.js)
- **TypeScript:** Zero erros de compilação no frontend (`tsc --noEmit` limpo)
- **Middleware:** `/dashboard/admin/*` protegido por decodificação de JWT no Edge
- **Auth context:** Tokens em cookie httpOnly (via `auth-context.tsx`)
- **Dashboards por role:** Correto roteamento START / PRO / COOPERATIVE / CORPORATE / ADMIN
- **Preview admin:** Barra de preview para ADMIN testar cada role sem logar
- **Dark mode:** ThemeToggle implementado com Tailwind dark: classes
- **Onboarding:** Tour guiado (`OnboardingTour`) para novos usuários

---

## 🔴 Crítico — Prisma Client Desatualizado

**Causa:** O schema `prisma/schema.prisma` foi atualizado (Asaas, QuantoVale, PasswordResetToken, etc.) mas `prisma generate` nunca foi executado após as mudanças. O client em `node_modules/.prisma/client` ainda reflete um schema antigo (Stripe, sem campos novos).

**Impacto:** O backend **não compila** em produção sem o generate. Afeta:
- `auth.service.ts` — `passwordResetToken`, `emailVerificationToken`, `cnpj` no User
- `subscriptions/asaas.service.ts` — `paymentStatus`, `asaasCustomerId`, `asaasSubscriptionId`
- `notifications/notifications.service.ts` — campo `readAt`
- `quantovale/quantovale.service.ts` — `quantovaleConnection`

**Correção obrigatória — executar localmente:**
```bash
cd apps/api
DATABASE_URL="postgresql://..." npx prisma generate
```

Ou no `package.json` do monorepo garantir que o `postinstall` rode o generate:
```json
"postinstall": "prisma generate --schema=prisma/schema.prisma"
```

---

## 🟡 Médio — Encontrados e Corrigidos Nesta Auditoria

| # | Problema | Arquivo | Status |
|---|----------|---------|--------|
| 1 | "Valuations" duplicado no nav da Instituição Financeira | `DashboardShell.tsx:123` | ✅ Corrigido |
| 2 | Carbon Credits: imports de enums do `@prisma/client` antes do generate | `carbon-credits.service.ts`, DTOs | ✅ Corrigido (enums locais) |
| 3 | Nav sem item "Carbono" nos planos START, PRO e ADMIN | `DashboardShell.tsx` | ✅ Corrigido |

---

## 🟡 Médio — Requer Atenção

### Segurança
- **Webhook sem assinatura HMAC:** O webhook do Asaas valida apenas por token fixo. Recomendado adicionar validação de assinatura HMAC-SHA256 para evitar replay attacks se o token vazar.
- **JWT sem rotação de refresh token:** O `RefreshToken` tem campo `revokedAt` mas não há lógica de rotação automática (rotate-on-use). Tokens roubados permanecem válidos até expirar.
- **Middleware do Next.js decodifica sem verificar:** O middleware Edge decodifica o JWT sem verificar a assinatura (não é possível usar `jsonwebtoken` no Edge Runtime). Uma solução é usar `jose` (edge-compatible) para verificação real.

### Pagamentos
- **Webhook Asaas exposto sem prefixo `/api/v1`:** A rota `/webhook/asaas` está fora do prefixo global (correto para o Asaas encontrá-la), mas garanta que a URL cadastrada no painel Asaas esteja atualizada no ambiente de produção.
- **Sem idempotência no webhook:** Se o Asaas reenviar um evento (retry), o estado da subscription pode ser atualizado duas vezes. Adicionar verificação de `asaasPaymentId` antes de processar.

### UX / Experiência
- **DashboardShell — Aba "Análise" PRO** aponta para `/dashboard/scoring` em dois itens diferentes ("Analytics" e "Score Premium"). Deduplique ou diferencie as rotas.
- **Pendências no dashboard admin:** O card "Pendências" é estático (hardcoded). Deveria buscar dados reais da API.

### Infraestrutura
- **`Dockerfile.web` e `Dockerfile.api`** — verificar se fazem `prisma generate` durante o build. O container não terá o client gerado localmente.

---

## 🟢 Baixo — Melhorias Recomendadas

- **Swagger desatualizado:** O `DocumentBuilder` não inclui as tags `carbon-credits`, `quantovale`, `webhooks` e `notifications`. Adicionar para completar a documentação da API.
- **Sem rate limiting específico por rota:** Operações sensíveis como `/auth/login`, `/auth/forgot-password` e `/webhook/asaas` deveriam ter throttling mais restrito (ex: 5 req/min).
- **Sem CSP (Content Security Policy):** O Helmet está ativo mas sem configuração de CSP customizada. Recomendado definir uma política CSP explícita.
- **Preços de mercado de carbono hardcoded:** O endpoint `/carbon-credits/market-prices` retorna dados mockados. Integrar com API externa (Verra API, CBL Markets) em produção.
- **Sem testes automatizados além do `scoring.service.spec.ts`:** Apenas 1 arquivo de teste encontrado. Recomendado adicionar testes para `auth`, `subscriptions`, `operations` e o novo módulo `carbon-credits`.

---

## 📋 Novo Módulo — Crédito de Carbono

### Entregues nesta sessão:

**Backend (NestJS):**
- `prisma/schema.prisma` — 5 novos modelos: `CarbonProject`, `CarbonInventory`, `CarbonCredit`, `CarbonTransaction`, `CarbonDocument`; 5 novos enums: `CarbonStandard`, `CarbonProjectType`, `CarbonProjectStatus`, `CarbonCreditStatus`, `CarbonTransactionType`
- `apps/api/src/modules/carbon-credits/` — módulo completo com controller, service e 4 DTOs validados
- `AppModule` — `CarbonCreditsModule` registrado
- 12 endpoints REST: dashboard, market-prices, CRUD de projetos, inventários, emissão e transações de créditos

**Frontend (Next.js):**
- `/dashboard/carbon-credits` — dashboard executivo com KPIs, lista de projetos e jornada
- `/dashboard/carbon-credits/projects` — listagem com status badges e métricas
- `/dashboard/carbon-credits/projects/new` — formulário completo de cadastro com calculadora de receita em tempo real
- `/dashboard/carbon-credits/projects/[id]` — detalhe com gestão de inventário e emissão de créditos inline
- `/dashboard/carbon-credits/mercado` — preços de referência, calculadora e recursos externos
- Menu de navegação atualizado para todos os roles (PRODUCER, COMPANY/PRO, ADMIN)

**Padrões internacionais suportados:** Verra VCS, Gold Standard, Protocolo Cerrado, REDD+, Fundo Amazônia, ABC+

---

## 🚀 Próximos Passos Prioritários

1. **Executar `prisma generate` no CI/CD** — crítico para o backend funcionar
2. **Verificar `Dockerfile.api`** para garantir que o generate roda no build da imagem
3. **Integrar preços reais** de carbono via API externa
4. **Adicionar HMAC ao webhook Asaas** para segurança de pagamentos
5. **Implementar rotação de refresh tokens**
6. **Adicionar testes** para os módulos críticos (auth, subscriptions, carbon-credits)
