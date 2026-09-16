# ConectCampo iOS — prontidão de publicação

## Implementado nesta fundação

- Projeto Capacitor iOS com bundle `digital.conectcampo.app` e iOS 15+.
- Time de assinatura automática da Buffalo (`594N6JQ75F`).
- Ícone e splash próprios da ConectCampo.
- Entrada dedicada em `app.conectcampo.digital`.
- Universal Links, credenciais associadas e esquema `conectcampo://`.
- Permissões com textos em português para Face ID, câmera e arquivos.
- Estado offline, status bar, splash nativo, conexão e haptics.
- Navegação inferior móvel por contexto, mantendo o menu completo.
- Catálogo StoreKit preparado para receber preços localizados, sem valor fixo no código.
- Cadastro pago no iOS direcionado exclusivamente ao StoreKit; o fluxo web por ValsaPay/Asaas permanece inalterado.
- Compra e restauração StoreKit 2 com validação JWS no backend antes da confirmação da transação.
- Vínculo antifraude por `appAccountToken`, identificação do produto e bloqueio de transações associadas a outra conta.
- App Store Server Notifications V2 para renovação, falha de cobrança, carência, expiração, reembolso e revogação.
- Push opt-in no iPhone, registro de dispositivo, preferências, links profundos e entrega APNs pelo backend.
- Domínio `app.conectcampo.digital` publicado no Railway, com DNS e HTTPS ativos.
- API autorizada a receber chamadas CORS do domínio do aplicativo.

## Xcode Cloud e TestFlight

Concluído em 16/09/2026:

1. Conta Apple da organização conectada ao Xcode e produto `App` habilitado no Xcode Cloud.
2. Repositório `giovannesartor/conectcampo-site` conectado ao Xcode Cloud, com esquema `App` compartilhado.
3. Script `mobile/ios/App/ci_scripts/ci_post_clone.sh` configurado junto do projeto para instalar Node.js 22, restaurar dependências e sincronizar o Capacitor no ambiente remoto.
4. Build remoto 3 concluído com sucesso no commit `6c89262`.
5. Build remoto 4 concluído com as ações `Build - iOS` e `Archive - iOS`, gerando o artefato `App 1.0 app-store` (build 4) preparado para o App Store Connect.
6. Gatilho automático limitado a alterações em `mobile/`; mudanças apenas em site, API ou documentação não consomem minutos do Xcode Cloud nem geram binários desnecessários.

Pendente para a distribuição e submissão:

1. Aguardar o processamento do primeiro build pela Apple e confirmar o ícone extraído do asset catalog no App Store Connect.
2. Criar ou selecionar um grupo interno do TestFlight e associar o build processado. O seletor do Xcode Cloud ainda não listava grupos internos.
3. Preencher e salvar na versão 1.0 a conta demonstrativa, a senha protegida e as notas para a equipe de revisão.
4. Selecionar o build na versão 1.0, associar as três assinaturas à primeira submissão e validar compra sandbox, restauração, push e links universais em aparelho real.

## Verificação

Por orientação do responsável pelo projeto, nenhum build, teste, servidor, simulador ou execução pesada é feito no checkout do SSD. O preparo foi realizado em cópia interna e a validação ocorreu exclusivamente no GitHub Actions, Xcode Cloud, Railway e endpoints publicados.

## Estado externo

- Small Business Program: inscrição enviada em 16/09/2026; aprovação pendente.
- GitHub Actions: lint, testes e build concluídos com sucesso no commit `6c89262` (execução `35159840987`).
- Xcode Cloud: build 3 concluído; build 4 concluiu build e archive e gerou `App 1.0 app-store`, versão 1.0, build 4.
- Railway: frontend e backend em `SUCCESS` no commit `6c89262`; `app.conectcampo.digital` ativo na porta 8080, com DNS validado e HTTPS funcional.
- API: health em `/api/v1/health` responde `200`, banco conectado e QuantoVale alcançável; CORS do app responde ao preflight com a origem dedicada.
- Estratégia iOS aprovada: app gratuito, disponibilidade somente no Brasil e assinaturas mensais em reais com acréscimo de 20% sobre o catálogo web. Pontos Apple preparados: R$ 359,00, R$ 959,00 e R$ 3.499,00.
- Apple Developer: App ID `digital.conectcampo.app` registrado com Associated Domains, In-App Purchase e Push Notifications.
- App Store Connect: app `ConectCampo` criado com Apple ID `6812836092`, SKU `conectcampo-ios-2026` e idioma principal Português (Brasil).
- Assinaturas: grupo `Planos ConectCampo` (`22390243`) criado com os produtos mensais `START`, `PRO` e `COOPERATIVE`, localizados em português e ordenados por nível de serviço.
- Assinaturas: imagem promocional de 1024 px e captura para revisão enviadas aos três produtos; a imagem promocional não substitui o ícone geral extraído do build.
- Página do produto: cinco capturas reais de iPhone (1284 × 2778 px) enviadas e mantidas na ordem dashboard, operações, CPR/documentos, campo/produção e mercado/cotações.
- Comercial: Acordo de Apps Pagos ativo, conta bancária ativa e formulários fiscais ativos no App Store Connect.
- App Store Server Notifications V2: produção e sandbox apontam para `https://api.conectcampo.digital/webhook/apple`.
- APNs: chave `QA55AYKQNJ` criada para sandbox e produção, com credenciais configuradas exclusivamente no Railway; o arquivo `.p8` não é versionado.
- Railway: `APPLE_IAP_APP_ID`, `APNS_KEY_ID` e `APNS_PRIVATE_KEY` configurados no backend, além dos IDs e certificados Apple já existentes.
- StoreKit/APNs: implementação e configuração externa concluídas; prova em aparelho real permanece pendente.
- AppIcon oficial de 1024 px presente no asset catalog; aparecerá no App Store Connect quando o primeiro build for processado.
- Exclusão de conta dentro do app implementada com confirmação de senha, revogação de sessão/dispositivo e anonimização dos dados de identificação.
- Metadados, respostas de classificação etária, inventário de privacidade, textos de revisão e roteiro de screenshots preparados em `docs/mobile/app-store-connect-metadata.md`.
