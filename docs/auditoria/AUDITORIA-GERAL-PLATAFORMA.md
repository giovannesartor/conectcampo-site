# 🧭 Auditoria Geral da Plataforma — ConectCampo

**Data:** 30/06/2026 · **Escopo:** todos os menus e funções (backend, frontend, UX, erros, bugs) + ideias de melhoria.
**Método:** revisão de código + cruzamento de todas as chamadas do frontend contra as rotas do backend.

> **Veredito rápido:** a plataforma está **mais sólida do que aparenta**. Cruzei **todas** as chamadas de API do front com as rotas do back e **nenhuma** aponta para endpoint inexistente. O único menu realmente "quebrado" era a **Auditoria** (gravava nada → tela vazia), já corrigido nesta sessão. O resto é **acabamento, robustez e features que faltam** — não código quebrado.

---

## ✅ Corrigido nesta sessão

| Item | Status |
|---|---|
| **Auditoria não gravava nada** (log nunca chamado) → agora há interceptor global de mutações + eventos de auth (login/logout/cadastro/reset/verificação) | ✅ |
| **Mudança de role/status** do usuário agora registrada com **diff antes/depois** + ator + IP | ✅ |
| IP real atrás do proxy (trust proxy) | ✅ |
| CPR: custo Física R$2.500 / Financeira 3% / fee 6% só captação; prazo 15a; carência 5a; safras por prazo | ✅ |
| CPR: PDF profissional com logo (ZapSign), e-mail/telefone, baixar PDF assinado, validação CPF/CNPJ + máscaras | ✅ |
| Score por IA (explicação + melhorias) | ✅ |
| Home: redesign estrutural; favicon premium; SEO (robots/sitemap/JSON-LD/OG) | ✅ |

---

## 🗺️ Auditoria menu a menu

Legenda: 🟢 ok · 🟡 melhorar · 🔴 corrigir

### Área pública (landing)
| Menu | Estado | Observações / ideias |
|---|---|---|
| Home | 🟢 | Redesenhada (hero 2 colunas, showcase, prova social). Trocar métricas ilustrativas por reais quando houver tração. |
| Planos / Como Funciona / Parceiros / Sobre / Contato / Carreiras / Blog | 🟡 | Existem; validar conteúdo real, formulários (contato/parceiros) com honeypot + rate-limit, e o **blog precisa de conteúdo** (SEO de alto valor). |
| Login / Cadastro / Recuperar senha | 🟢 | Fluxo completo, com verificação de e-mail e gateways de pagamento. Ideia: indicador de força de senha + “mostrar senha”. |

### Dashboard — Tomador (Produtor/Empresa/Cooperativa)
| Menu | Estado | Observações / ideias |
|---|---|---|
| Visão Geral | 🟢 | KPIs + onboarding. Ideia: estados vazios mais acionáveis (“crie sua 1ª operação”). |
| Operações | 🟢 | CRUD + submit + propostas. Ideia: **filtros/ordenação/busca** na tabela e **comparador de propostas** lado a lado. |
| Propostas | 🟡 | Aceitar/recusar ok. Ideia: histórico e motivo da recusa; notificação ao parceiro. |
| Documentos (data room) | 🟡 | Upload + presigned URL + grant-access. Validar **tipo MIME real + tamanho + antivírus**; UI de versões. |
| Score | 🟢 | Corrigido (lia campos errados) + **explicação por IA**. Ideia: simulação “e se eu melhorar X”. |
| CPR | 🟢 | Completíssima agora (custos, prazo, carência, safras, PDF, assinatura ZapSign). |
| Crédito de Carbono | 🟡 | Dashboard + projetos + emissão. **Preços de mercado são ilustrativos** → integrar Verra/B3. |
| Assinatura | 🟢 | Interna + ZapSign com trilha. Ideia: exigir CPF/selfie via ZapSign em contas sensíveis. |
| Valuations (QuantoVale) | 🟡 | Integração existe; validar credenciais/erros e estados de carregamento. |
| Assinatura/Plano | 🟡 | Planos hardcoded no front → servir via `/subscriptions/plans` (fonte única). |
| Configurações | 🟡 | Perfil/notificações. Ideia: 2FA, sessões ativas, trocar e-mail com verificação. |

### Dashboard — Instituição Financeira
| Menu | Estado | Observações |
|---|---|---|
| Oportunidades / Propostas / Portfólio / Analytics | 🟢 | Deal-flow funcional. Ideia: filtros de risco salvos, export, e **API key** self-service para integração. |

### Dashboard — Admin
| Menu | Estado | Observações |
|---|---|---|
| Painel / Usuários / Operações / Parceiros / Receita | 🟢 | Funcionais. Usuários: role/status agora **auditados com diff**. |
| **Auditoria** | 🟢 (corrigido) | Antes vazio (nada gravava). Agora registra mutações + eventos de auth e admin. |

---

## 🐛 Bugs & riscos concretos encontrados

| # | Sev | Onde | Problema | Ação sugerida |
|---|---|---|---|---|
| 1 | 🟢 (feito) | auditoria | Logs nunca gravados | Corrigido nesta sessão |
| 2 | 🟡 | `NotificationsDropdown.tsx` | `catch {}` silencioso (3x) | Logar/toast discreto em falha de marcar-como-lido |
| 3 | 🟡 | webhooks (Asaas/ZapSign) | Sem **idempotência** — reenvio reaplica estado | Tabela `WebhookEvent` única por `(provider, externalId)` |
| 4 | 🟡 | uploads (documents) | Validação de arquivo fraca | `file-type` + limite de tamanho + scan |
| 5 | 🟡 | preços/taxas | R$2.500 / 3% / 6% **espalhados** entre front e back | Centralizar numa config única servida pela API |
| 6 | 🟡 | carbon `market-prices` | Dados ilustrativos | Integração externa real |
| 7 | 🟢 | refresh token | Sem detecção de reuso | Revogar família ao detectar token revogado reusado |
| 8 | 🟡 | observabilidade | Sem Sentry/Web Vitals | Instrumentar erros + RUM |

> Não foram encontrados endpoints chamados pelo front que não existam no back, nem helpers de formatação ausentes, nem `dangerouslySetInnerHTML` perigoso (só o JSON-LD controlado).

---

## 🎨 UX / Experiência — observações gerais

- **Estados vazios**: padronizar “empty states” acionáveis (com CTA) em todas as listas (operações, propostas, documentos, CPR, carbono).
- **Feedback**: padronizar toasts (sucesso/erro/undo) — hoje há mistura de `alert()` nativo e `react-hot-toast`. Trocar `alert()` por toast.
- **Skeletons**: já há alguns; padronizar em todas as telas (percepção de velocidade).
- **Tabelas**: faltam ordenação/colunas configuráveis/busca em várias (operações, usuários, auditoria já tem filtros).
- **Acessibilidade**: revisar contraste de textos cinza-claro, foco visível (já melhorado globalmente), `aria-label` em botões-ícone.
- **Mobile**: validar drawers e tabelas com scroll horizontal em telas pequenas (público rural usa muito celular).
- **Onboarding**: o tour existe; complementar com “checklist de primeiros passos” persistente.

---

## 💡 Ideias & funções que faltam (priorizadas)

### P0 — fecham ciclos / credibilidade
1. **Idempotência de webhooks** (pagamento e assinatura) — integridade.
2. **Centralizar preços/taxas** numa config (evita divergência front/back).
3. **Sentry + Web Vitals** — parar de operar às cegas.
4. **Comparador de propostas** lado a lado (decisão do tomador).

### P1 — produto
5. **Notificações em tempo real** (WebSocket) — proposta nova, documento aprovado, CPR assinada.
6. **Filas (BullMQ)** para e-mail, geração de PDF e scoring — escala/estabilidade.
7. **API key self-service** para instituições financeiras.
8. **Registrar cada custo de emissão como comissão/receita** rastreável (liga ao modelo `Commission`).
9. **2FA/TOTP** + sessões ativas nas Configurações.

### P2 — crescimento
10. **Conteúdo de blog** (crédito rural, CPR, FIDC) — tráfego orgânico de alto valor.
11. **PWA instalável** (campo com conectividade ruim).
12. **Monitoramento de garantia/safra por satélite** (diferencial vs concorrentes).
13. **Copiloto IA** (RAG sobre os dados do usuário) e **alertas inteligentes**.

---

## 🔒 Segurança — resumo

Forte: CSP, Helmet, JWT guard + rotação de refresh, throttle por rota, validação estrita, RBAC, audit log (agora ativo), trust proxy, assinatura com hash/IP.
A endereçar: idempotência+HMAC nos webhooks, validação de upload, detecção de reuso de refresh token, 2FA, throttler distribuído (Redis) em multi-instância.

---

## 🚀 Próximos passos recomendados (ordem)

1. Idempotência de webhooks + centralizar preços/taxas (P0, baixo esforço, alto valor).
2. Sentry + Web Vitals (P0, ½ dia).
3. Comparador de propostas + estados vazios/toasts padronizados (P0/UX).
4. Realtime (WebSocket) + filas (P1).
5. Integrações reais: bureaus (Serasa/Receita), preços de carbono, satélite (P1/P2).

> Este documento complementa o `AUDITORIA-TECNICA-2026.md` (relatório técnico aprofundado) e reflete o estado **após** as correções desta sessão.
