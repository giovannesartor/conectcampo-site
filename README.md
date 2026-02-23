<p align="center">
  <img src="https://img.shields.io/badge/ConectCampo-Marketplace%20Agro-22c55e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik03IDIwaDEwIi8+PHBhdGggZD0iTTEyIDIwdi0xMiIvPjxwYXRoIGQ9Im0xMiA0LTQgNGg4bC00LTRaIi8+PC9zdmc+" alt="ConectCampo" />
</p>

<h1 align="center">🌾 ConectCampo</h1>
<p align="center">
  <strong>Marketplace SaaS de Crédito Agro</strong><br/>
  Conectando produtores rurais e empresas do agronegócio ao crédito certo.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-10-red?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Railway-Deploy-0B0D0E?logo=railway" alt="Railway" />
</p>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Modelo de Negócio](#-modelo-de-negócio)
- [Tech Stack](#-tech-stack)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Primeiros Passos](#-primeiros-passos)
- [Módulos](#-módulos)
- [API Docs](#-api-docs)
- [Fluxo Principal](#-fluxo-principal)
- [Segurança & Compliance](#-segurança--compliance)
- [Deploy](#-deploy)
- [Roadmap](#-roadmap)

---

## 🎯 Visão Geral

**ConectCampo** é um marketplace SaaS que conecta produtores rurais e empresas do agronegócio a:

| Parceiro | Tipo |
|----------|------|
| 🏦 Bancos | Crédito rural tradicional |
| 🤝 Cooperativas | Crédito cooperativo |
| 📊 FIDCs | Fundos de Investimento em Direitos Creditórios |
| 📜 Securitizadoras | CRA (Certificado de Recebíveis do Agronegócio) |
| 🌱 FIAGROs | Fundos de Investimento nas Cadeias Produtivas Agroindustriais |
| 💹 Mercado de Capitais | Captações estruturadas |
| 🏗️ Estruturadores | Assessoria financeira especializada |

### Modelo híbrido: SaaS + Comissão

```
Receita = Assinatura mensal (Produtor Rural R$299 / Empresa R$799 / Cooperativa R$2.890 / Inst. Financeira Grátis) + Comissão por operação fechada
```

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                 │
│  Landing Page │ Dashboard │ Data Room │ Auth Pages       │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────┴──────────────────────────────────┐
│                    BACKEND (NestJS)                       │
│  Auth │ Users │ Producers │ Operations │ Scoring │ Match │
│  Partners │ Documents │ Subscriptions │ Audit │ Health   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│            PostgreSQL (Prisma ORM)  +  Redis (Queue)     │
└─────────────────────────────────────────────────────────┘
```

---

## 💼 Modelo de Negócio

### Segmentação por Faixa

| Faixa | Perfil | Receita Anual | Produtos |
|-------|--------|---------------|----------|
| **A** | Pequeno Produtor | Até R$ 500k | Crédito rápido, cooperativas |
| **B** | Médio Produtor | R$ 500k – R$ 5M | Bancos + FIDC, CPR, recebíveis |
| **C** | Grande Produtor | R$ 5M – R$ 50M | FIDC estruturado, CRA, notas comerciais |
| **D** | Agroindústria | R$ 50M+ | Mercado de capitais, M&A |

### Comissões

| Faixa | Taxa | Fee Fixo |
|-------|------|----------|
| A | 0,5% – 1,5% | — |
| B | 1,0% – 2,5% | — |
| C | 1,5% – 4,0% | — |
| D | 2,0% – 5,0% | R$ 50.000 |

---

## 🛠 Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Backend | NestJS 10, Node.js 20, TypeScript 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | JWT + Refresh Tokens + RBAC |
| Queue | Bull + Redis |
| Storage | S3-compatible (Cloudflare R2 / AWS S3) |
| Payments | Stripe / Mercado Pago |
| Infra | Docker, Railway |
| CI/CD | GitHub Actions |
| Docs | Swagger / OpenAPI |

---

## 📁 Estrutura do Projeto

```
conectcampo-site/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/         # Prisma service
│   │   │   └── modules/
│   │   │       ├── auth/       # JWT + RBAC
│   │   │       ├── users/
│   │   │       ├── producers/
│   │   │       ├── operations/
│   │   │       ├── scoring/    # Motor de score
│   │   │       ├── matching/   # Motor de match
│   │   │       ├── partners/
│   │   │       ├── documents/  # Data room
│   │   │       ├── subscriptions/
│   │   │       ├── audit/      # Compliance
│   │   │       └── health/
│   │   └── Dockerfile
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx         # Landing page
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   └── dashboard/
│       │   ├── components/
│       │   │   └── landing/
│       │   └── lib/
│       │       ├── api.ts           # Axios client
│       │       └── auth-context.tsx # Auth state
│       └── Dockerfile
├── packages/
│   ├── types/              # Tipos compartilhados
│   └── utils/              # Utilitários (validators, formatters, commission)
├── prisma/
│   └── schema.prisma       # Schema completo (18 modelos)
├── docker-compose.yml
├── turbo.json
└── .github/workflows/ci.yml
```

---

## 🚀 Primeiros Passos

### Pré-requisitos

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup Local

```bash
# 1. Clone
git clone https://github.com/giovannesartor/conectcampo-site.git
cd conectcampo-site

# 2. Instale dependências
npm install

# 3. Copie variáveis de ambiente
cp .env.example .env

# 4. Suba banco e Redis
docker compose up postgres redis -d

# 5. Gere Prisma client
cd prisma && npx prisma generate && cd ..

# 6. Rode migrations
cd prisma && npx prisma db push && cd ..

# 7. Inicie em dev
npm run dev
```

Acesse:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api/v1
- **Swagger:** http://localhost:3001/docs

### Docker (Tudo junto)

```bash
docker compose up --build
```

---

## 📦 Módulos

### 🔐 Auth (JWT + RBAC)
- Registro e login com bcrypt
- JWT + Refresh Token (rotation)
- 5 roles: `PRODUCER`, `COMPANY`, `FINANCIAL_INSTITUTION`, `CREDIT_ANALYST`, `ADMIN`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@Public()`, `@Roles()`, `@CurrentUser()`

### 📊 Motor de Score
Calcula Risk Score (0–100) baseado em:
- Receita anual (20%)
- Histórico produtivo (15%)
- Garantias (20%)
- Endividamento (15%)
- Fluxo de caixa (15%)
- Histórico de crédito (10%)
- Seguro (5%)

Determina perfil: **Conservador** (70+) | **Moderado** (40-69) | **Estruturado** (<40)

### 🔄 Motor de Match
Cruza operação com parceiros usando:
- Adequação de ticket (25%)
- Garantias aceitas (20%)
- Região (15%)
- Cultura (15%)
- Score mínimo (15%)
- Tipo de operação (10%)

### 📂 Data Room
- Upload versionado por tipo de operação
- Controle de acesso por instituição
- Verificação por analista
- Soft delete

### 💼 Marketplace B (Lado financeiro)
- Dashboard com pipeline e KPIs
- Dossiês elegíveis
- Histórico de propostas

---

## 📚 API Docs

Com o backend rodando, acesse: **http://localhost:3001/docs**

### Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| GET | `/users/me` | Perfil do usuário |
| POST | `/producers/profile` | Criar perfil produtor |
| POST | `/operations` | Nova operação |
| POST | `/scoring/:operationId` | Calcular score |
| POST | `/matching/:operationId` | Executar match |
| GET | `/partners` | Listar parceiros |
| GET | `/health` | Health check |

---

## 🔄 Fluxo Principal

```
1. Cadastro → 2. Perfil → 3. Tipo de crédito → 4. Dados financeiros
→ 5. Upload docs → 6. Score gerado → 7. Match executado
→ 8. Parceiros recebem → 9. Propostas → 10. Aceite
→ 11. Comissão calculada → 12. Pós-crédito
```

---

## 🔒 Segurança & Compliance

| Requisito | Status |
|-----------|--------|
| LGPD Compliant | ✅ Consentimento explícito |
| Criptografia em repouso | ✅ Banco encrypted |
| Criptografia TLS | ✅ HTTPS enforced |
| Auditoria completa | ✅ AuditLog imutável |
| Controle de acesso | ✅ RBAC granular |
| KYC básico | ✅ Verificação de documentos |
| Soft delete | ✅ Dados nunca são apagados |
| Tokens seguros | ✅ JWT + Refresh rotation |

---

## 🚢 Deploy

### Railway

1. Crie projeto no [Railway](https://railway.app)
2. Adicione serviço PostgreSQL
3. Configure variáveis de ambiente (ver `.env.example`)
4. Adicione `RAILWAY_TOKEN` nos GitHub Secrets
5. Push para `main` — deploy automático via GitHub Actions

### Variáveis obrigatórias no Railway

```
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
CORS_ORIGIN
API_PORT=3001
NEXT_PUBLIC_API_URL
```

---

## 🗺 Roadmap

- [x] Monorepo com Turbo
- [x] Prisma schema (18 modelos)
- [x] Auth com JWT + RBAC
- [x] Motor de Score
- [x] Motor de Match MVP
- [x] Landing page
- [x] Dashboard base
- [x] Docker + Railway config
- [x] CI/CD GitHub Actions
- [ ] Integração S3 (upload real)
- [ ] Stripe/Mercado Pago
- [ ] Assinatura eletrônica
- [ ] Worker (filas Bull)
- [ ] Marketplace de benefícios
- [ ] Notificações push
- [ ] Relatórios PDF
- [ ] App mobile (React Native)
- [ ] Correspondente bancário regulado

---

## 📄 Licença

Proprietary - ConectCampo © 2026. Todos os direitos reservados.

---

<p align="center">
  Feito com 💚 para o agronegócio brasileiro
</p>
