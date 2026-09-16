# ConectCampo Mobile — arquitetura e escopo

## Direção do produto

O aplicativo usa a mesma estratégia validada no Fé360: uma camada nativa Capacitor hospeda a aplicação web responsiva publicada em `app.conectcampo.digital`. A API, as regras de negócio e os dados continuam únicos. Isso reduz divergência entre web, iOS e Android, mantém os módulos sincronizados e permite introduzir recursos nativos onde eles realmente melhoram a experiência.

O site institucional permanece em `conectcampo.digital`. A aplicação autenticada usa `app.conectcampo.digital`, e o backend permanece em `api.conectcampo.digital`.

## Identidade técnica

- Nome: ConectCampo
- Bundle ID iOS: `digital.conectcampo.app`
- Domínio do app: `app.conectcampo.digital`
- Universal Links: `https://app.conectcampo.digital/*`
- URL Scheme de contingência: `conectcampo://`
- Time Apple: `594N6JQ75F` (Buffalo Participacoes e Assessoria Ltda)
- Base mínima planejada: iOS 15

## Cobertura funcional

O app deve oferecer as mesmas jornadas autorizadas para cada perfil da plataforma:

1. Conta: entrada, criação, confirmação de e-mail, recuperação, perfil, preferências e exclusão.
2. Assinatura: escolha de plano, teste quando elegível, compra via StoreKit no iOS, restauração, troca e gerenciamento.
3. Crédito: nova operação, rascunho, envio, propostas, acompanhamento e portfólio.
4. Documentos: câmera/arquivos, envio, pendências, visualização e compartilhamento.
5. CPR: criação, revisão, PDF, emissão, link ZapSign, acompanhamento da assinatura, registro e liquidação.
6. Produção: áreas, talhões, diário de safra, NDVI, clima e risco de safra.
7. Financeiro: calendário, fluxo de caixa e barter.
8. Mercado: cotações, alertas, marketplace e contratos de venda.
9. Inteligência: score, analytics, valuations e documentos inteligentes.
10. Comunicação: notificações push, central de avisos e links profundos para a ação correspondente.
11. Perfis especiais: cooperativa, instituição financeira e analista com seus painéis próprios.

O painel administrativo completo continua prioritariamente na web. O aplicativo pode oferecer supervisão e alertas administrativos, mas ações sensíveis em massa devem continuar protegidas pela experiência web de desktop.

## Navegação móvel

As dezenas de páginas do painel não devem virar dezenas de itens em uma barra lateral pequena. A navegação móvel será agrupada em cinco áreas:

- **Hoje**: resumo, alertas, pendências e atalhos contextuais.
- **Operações**: crédito, propostas, CPR, documentos e contratos.
- **Campo**: áreas, safra, NDVI, clima e risco.
- **Mercado**: cotações, marketplace, financeiro e barter.
- **Perfil**: conta, plano, preferências, ajuda e segurança.

O conteúdo continua filtrado pelo perfil e plano do usuário. Cada tela mantém rotas próprias para links universais, push e compartilhamento.

## Pagamentos no iOS

Assinaturas que liberam recursos digitais no aplicativo devem usar StoreKit. Os preços não ficam gravados no frontend: o aplicativo exibe o preço localizado retornado pela App Store e o backend valida a transação assinada antes de liberar o plano.

Produtos sugeridos:

- `digital.conectcampo.start.monthly`
- `digital.conectcampo.pro.monthly`
- `digital.conectcampo.cooperative.monthly`

O plano `CORPORATE` permanece gratuito. Clientes que já assinam pelo site entram com a mesma conta e mantêm o acesso. O app deve oferecer **Restaurar compras** e **Gerenciar assinatura**.

Os valores dos planos iOS serão definidos mais perto da publicação. Em 16 de setembro de 2026, a inscrição da Buffalo no App Store Small Business Program foi enviada e está aguardando a aprovação da Apple. Até a aprovação, a comissão padrão aplicável a uma nova assinatura continua sendo 30% no primeiro ano e 15% depois de um ano contínuo do mesmo assinante. Após a aprovação, o programa reduz a comissão elegível para 15%. Esse registro não aprova aumento nem fixa preço comercial.

Pagamentos de bens físicos, commodities, crédito e liquidação de operações não são assinatura digital do app e continuam nos fluxos financeiros próprios da plataforma, sujeitos à revisão jurídica e às regras do provedor. A compra do acesso ao software, por outro lado, usa StoreKit no iOS.

## Recursos nativos por etapa

### Fundação

- App iOS Capacitor com tela de abertura e contingência offline.
- Domínio exclusivo e Universal Links.
- Aparência, áreas seguras, status bar, haptics e compartilhamento.
- Sessão persistente e restauração após atualização.

### Operação

- Câmera e seletor de arquivos para documentos.
- Visualização e compartilhamento de PDFs.
- Face ID opcional para reabrir sessões sensíveis.
- Push para proposta, documento, CPR, assinatura e vencimento.

### Comercial

- StoreKit 2, produtos localizados, restauração e webhooks da App Store.
- Vinculação segura da compra à conta ConectCampo.
- Estados de cobrança, reembolso, expiração e período de carência.

## Critérios de segurança

- Nenhuma CPR, assinatura, pagamento ou operação real é disparada por validação automática.
- Transações da App Store só liberam acesso após validação no servidor.
- Universal Links aceitam apenas hosts e rotas permitidos.
- Tokens e documentos não são colocados em logs.
- A conta pode encerrar sessão e solicitar exclusão dentro do app.
- A revisão da Apple recebe uma conta demonstrativa sem dados de cliente real.

## Publicação

O fluxo segue o usado no Fé360: App Store Connect, assinatura automática no Xcode, TestFlight interno, revisão externa e publicação. Builds e testes não são executados no SSD do projeto; quando autorizados, rodam em cópia temporária ou CI hospedado.
