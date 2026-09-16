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

1. Entrar no Xcode com uma conta que também tenha acesso ao App Store Connect da organização; a conta Apple atualmente conectada ao Xcode não aparece na lista de usuários do App Store Connect e, por isso, a opção **Criar fluxo** permanece desativada.
2. Conectar o repositório ao Xcode Cloud; o esquema `App` já está compartilhado e o script `ci_scripts/ci_post_clone.sh` prepara Capacitor e dependências no ambiente remoto.
3. Gerar o archive remoto e enviar o primeiro build ao TestFlight. O App Store Connect extrairá o ícone do app desse build processado.
4. Preencher e salvar na versão 1.0 a conta demonstrativa, a senha protegida e as notas para a equipe de revisão. Esses campos não estavam persistidos na conferência de 16/09/2026.
5. Selecionar o build na versão 1.0, associar as três assinaturas à primeira submissão e validar compra sandbox, restauração, push e links universais em aparelho real.

## Verificação

Por orientação do responsável pelo projeto, nenhum build, teste, servidor, simulador ou execução pesada é feito no checkout do SSD. A implementação ocorre em cópia temporária. Builds e testes serão feitos apenas quando autorizados, em CI ou ambiente temporário.

## Estado externo

- Small Business Program: inscrição enviada em 16/09/2026; aprovação pendente.
- Railway: frontend e backend em `SUCCESS` no commit `c0f2816`; `app.conectcampo.digital` ativo na porta 8080, com DNS validado e HTTPS funcional.
- API: health em `/api/v1/health` responde `200`; CORS do app responde ao preflight com a origem dedicada.
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
