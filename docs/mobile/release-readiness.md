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

1. Criar o identificador do app e habilitar Associated Domains no Apple Developer.
2. Criar o app e o grupo de assinaturas no App Store Connect.
3. Cadastrar os produtos START, PRO e COOPERATIVE; preços continuam pendentes de decisão.
4. Definir os preços e eventual oferta introdutória somente quando a estratégia comercial for aprovada.
5. Cadastrar a URL de produção de App Store Server Notifications V2: `https://api.conectcampo.digital/webhook/apple`.
6. Criar a chave APNs e configurar os segredos no Railway, sem versionar a chave `.p8`.
7. Configurar no Railway o ID numérico do app e os certificados raiz Apple usados pela validação JWS.
8. Preparar conta demonstrativa sem dados de clientes e textos de revisão da Apple.
9. Gerar o archive em ambiente temporário/CI, enviar ao TestFlight e validar compra sandbox, restauração, push e links universais em aparelho real.

## Verificação

Por orientação do responsável pelo projeto, nenhum build, teste, servidor, simulador ou execução pesada é feito no checkout do SSD. A implementação ocorre em cópia temporária. Builds e testes serão feitos apenas quando autorizados, em CI ou ambiente temporário.

## Estado externo

- Small Business Program: inscrição enviada em 16/09/2026; aprovação pendente.
- Railway: frontend e backend em `SUCCESS`; `app.conectcampo.digital` ativo na porta 8080, com DNS validado e HTTPS funcional.
- API: health em `/api/v1/health` responde `200`; CORS do app responde ao preflight com a origem dedicada.
- Preços iOS: não definidos e não alterados.
- App Store Connect: login da conta Apple ainda necessário para criar o registro e os produtos.
- StoreKit/APNs: implementação concluída no código; configuração externa e prova em aparelho real permanecem pendentes.
