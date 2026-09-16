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
- Checkout externo bloqueado no app iOS; o fluxo web por ValsaPay/Asaas permanece inalterado.

## Obrigatório antes do TestFlight

1. Ativar `app.conectcampo.digital` no Railway e publicar o registro DNS indicado.
2. Criar o identificador do app e habilitar Associated Domains no Apple Developer.
3. Criar o app e o grupo de assinaturas no App Store Connect.
4. Cadastrar os produtos START, PRO e COOPERATIVE; preços continuam pendentes de decisão.
5. Implementar e revisar a validação StoreKit 2 no backend, com vínculo entre transação e usuário.
6. Implementar compra, restauração, expiração, reembolso e notificações App Store Server.
7. Concluir o cadastro pago iOS pelo StoreKit; enquanto isso, o app bloqueia planos pagos sem abrir gateway externo.
8. Configurar push/APNs e a política de notificações.
9. Preparar conta demonstrativa sem dados de clientes e textos de revisão da Apple.

## Verificação

Por orientação do responsável pelo projeto, nenhum build, teste, servidor, simulador ou execução pesada é feito no checkout do SSD. A implementação ocorre em cópia temporária. Builds e testes serão feitos apenas quando autorizados, em CI ou ambiente temporário.

## Estado externo

- Small Business Program: inscrição enviada em 16/09/2026; aprovação pendente.
- Railway: serviços atuais estão em `SUCCESS`; a criação do novo domínio está bloqueada porque a sessão do CLI permite leitura, mas exige novo login para mutações.
- Preços iOS: não definidos e não alterados.
