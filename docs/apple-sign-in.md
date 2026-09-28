# Sign in with Apple — ConectCampo

Integração nativa iOS (`digital.conectcampo.app`), separada das assinaturas StoreKit.
O Google continua pendente; o login por e-mail/senha continua disponível.

## Segurança e configuração

- Capacidade Sign in with Apple no identificador primário e entitlement nativo.
- Chave exclusiva do ConectCampo; não reutilizar nem revogar chaves do Fé360.
- Backend: `APPLE_SIGN_IN_ENABLED`, `APPLE_SIGN_IN_TEAM_ID`, `APPLE_SIGN_IN_KEY_ID`,
  `APPLE_SIGN_IN_PRIVATE_KEY_BASE64` e `APPLE_SIGN_IN_ENCRYPTION_KEY` (32 bytes em Base64).
- Nunca incluir chaves no Git, frontend, screenshots ou logs. A chave de criptografia
  não pode ser substituída sem migrar os tokens criptografados existentes.
- O botão só aparece com plugin nativo presente e configuração completa no servidor.
  Builds antigos e navegador não anunciam uma autenticação indisponível.
- Código de autorização trocado exclusivamente no servidor; assinatura RS256,
  emissor, audiência, validade e nonce conferidos. Desafios expiram em 5 minutos,
  têm consumo atômico e são vinculados ao usuário nas ações de vínculo/exclusão.
- Cadastro usa confirmação de uso único de 15 minutos. Nunca unir contas por e-mail.
  Vínculo exige sessão, senha atual e confirmação nativa da Apple.
- Tokens de atualização Apple são criptografados com AES-256-GCM.
- Exclusão de conta aceita reautenticação Apple e mantém uma fila persistente para
  revogar a autorização no provedor, com novas tentativas em caso de indisponibilidade.
- Admin > Acessos e e-mails mostra configuração, eventos, vínculos e revogações pendentes.

## Publicação e validação

Usar somente GitHub Actions, Railway e Xcode Cloud. Não executar testes, builds,
simuladores ou instalação de dependências no SSD do usuário.

Antes da liberação pública, confirmar em aparelho: novo cadastro com compartilhar
e-mail e ocultar e-mail, login recorrente, cancelamento, vínculo em conta existente,
tentativa de vínculo duplicado, exclusão Apple e recuperação por e-mail. Registrar
o remetente real no Private Email Relay da Apple e verificar entrega para relay.
Nenhuma compra, exclusão de cliente real ou aceite pessoal deve ser usado como teste.
