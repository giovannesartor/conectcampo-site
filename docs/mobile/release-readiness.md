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

## Obrigatório antes do TestFlight

1. Definir os preços e eventual oferta introdutória somente quando a estratégia comercial for aprovada.
2. Completar metadados, privacidade, classificação etária, capturas de tela e informações de revisão no App Store Connect.
3. Preparar conta demonstrativa sem dados de clientes e textos de revisão da Apple.
4. Gerar o archive em ambiente temporário/CI, enviar ao TestFlight e validar compra sandbox, restauração, push e links universais em aparelho real.

## Verificação

Por orientação do responsável pelo projeto, nenhum build, teste, servidor, simulador ou execução pesada é feito no checkout do SSD. A implementação ocorre em cópia temporária. Builds e testes serão feitos apenas quando autorizados, em CI ou ambiente temporário.

## Estado externo

- Small Business Program: inscrição enviada em 16/09/2026; aprovação pendente.
- Railway: frontend e backend em `SUCCESS`; `app.conectcampo.digital` ativo na porta 8080, com DNS validado e HTTPS funcional.
- API: health em `/api/v1/health` responde `200`; CORS do app responde ao preflight com a origem dedicada.
- Preços iOS: não definidos e não alterados.
- Apple Developer: App ID `digital.conectcampo.app` registrado com Associated Domains, In-App Purchase e Push Notifications.
- App Store Connect: app `ConectCampo` criado com Apple ID `6812836092`, SKU `conectcampo-ios-2026` e idioma principal Português (Brasil).
- Assinaturas: grupo `Planos ConectCampo` (`22390243`) criado com os produtos mensais `START`, `PRO` e `COOPERATIVE`, localizados em português e ordenados por nível de serviço.
- App Store Server Notifications V2: produção e sandbox apontam para `https://api.conectcampo.digital/webhook/apple`.
- APNs: chave `QA55AYKQNJ` criada para sandbox e produção, com credenciais configuradas exclusivamente no Railway; o arquivo `.p8` não é versionado.
- Railway: `APPLE_IAP_APP_ID`, `APNS_KEY_ID` e `APNS_PRIVATE_KEY` configurados no backend, além dos IDs e certificados Apple já existentes.
- StoreKit/APNs: implementação e configuração externa concluídas; prova em aparelho real permanece pendente.
