# Meta de produto — ConectCampo

## Objetivo

Transformar o ConectCampo na referência brasileira em organização de crédito agro: uma plataforma profissional, confiável e auditável que conecta dados da operação, documentos, CPR, produção, finanças, comercialização e instituições financeiras sem prometer aprovação automática nem esconder a responsabilidade de cada decisão.

## Princípios permanentes

1. **Dado real antes de indicador bonito.** Falhas de API aparecem como falha; nunca como zero. Limites, documentos, propostas, valores e status vêm do backend.
2. **Oferta igual ao produto.** Home, planos e checkout usam a mesma configuração. Funcionalidade ainda não entregue não aparece como promessa comercial.
3. **Jornada por perfil.** Produtor, Empresa, Cooperativa, Instituição, Analista e Administrador veem apenas os módulos e ações que correspondem à sua função.
4. **Decisões críticas auditáveis.** Exclusão, cancelamento, revogação de chave, reinício de assinatura e liberação financeira exigem contexto, confirmação e, quando necessário, justificativa registrada.
5. **Clareza jurídica e financeira.** CPR Financeira usa custo ConectCampo de 0,8% sobre o valor de face. Emolumentos, tributos e encargos externos são apresentados separadamente.
6. **Design consistente.** Preservar as cores atuais e aplicar a mesma hierarquia, tipografia, espaçamento, cabeçalho, estado vazio, erro, carregamento, tabela e modal em toda a plataforma.
7. **Evolução sem ruptura.** Melhorias devem reduzir esforço e complexidade sem remover recursos úteis ou alterar radicalmente a identidade aprovada.

## Arquitetura de jornadas

- **Produtor e Empresa:** Hoje → Operações → Propostas → Documentos → Instrumentos → Minha Fazenda → Financeiro → Mercado → Conta.
- **Cooperativa:** Hoje → Carteira por cooperado → Operações → Documentos → Risco → Instrumentos → Gestão operacional.
- **Instituição:** Deal flow → Análise → Propostas → Portfólio → Analytics → Monitoramento.
- **Analista:** Fila priorizada → SLA → Score e risco → Documentos → CPR e garantias.
- **Administrador:** Indicadores reais → Usuários → Operações → Parceiros → Leads → Disputas → Receita → Auditoria. Ferramentas operacionais aparecem somente no modo de visualização por perfil.

## Critérios de aceite da evolução atual

- Plano START limita duas operações simultâneas no frontend e no backend.
- Contadores de documentos, propostas, operações, usuários e parceiros usam dados persistidos.
- Cooperativa recebe visão consolidada por cooperado e exportação da carteira, sem promessas de módulos inexistentes.
- Instituição possui páginas próprias para oportunidades, propostas, portfólio e analytics.
- Busca global reutiliza exatamente a navegação do perfil e do plano.
- Ações críticas usam confirmação acessível, exibem consequência e registram justificativa quando aplicável.
- Admin possui pipeline de leads, operações navegáveis, filtros compreensíveis e erros explícitos.
- Home apresenta uma mensagem mais curta, seis módulos principais, catálogo completo, Blog e Central de Ajuda.
- Planos públicos são carregados de uma única fonte de verdade.
- CPR-F segue o padrão documental completo da operação: quadro-resumo, produção e armazenamento, condições financeiras conciliadas, garantias e anuências, 35 cláusulas, cronograma, assinaturas de todas as partes e custo ConectCampo de 0,8% sobre o valor de face.
- A ZapSign cria links individuais e envia o convite ao contato configurado; nenhuma assinatura é gerada automaticamente em nome do participante, e CPR com avalista não pode ser concluída por um fluxo que ignore o garantidor.
- Publicação só é considerada concluída após Git, Railway, health check, logs e validação das rotas públicas.

## Próximas frentes

- Evoluir documentos inteligentes para upload com conferência lado a lado e versionamento.
- Criar hub unificado de monitoramento (NDVI, clima, risco e ações de campo).
- Integrar eventos automáticos entre CPR, contratos, parcelas, calendário e fluxo de caixa.
- Adicionar atribuição de responsável, notas internas e políticas configuráveis de SLA.
- Expandir a cooperativa com convites, limites, documentos e risco por CNPJ.
- Evoluir diário de safra para captura móvel de foto, áudio, geolocalização e fila offline.

Essas frentes dependem de regras operacionais e modelos de dados próprios; devem ser entregues incrementalmente, com migração, autorização e evidência de uso real.

## Referências de mercado verificadas

- [Aegro — gestão rural](https://aegro.com.br/): integração entre caderno de campo, estoque, custos e financeiro, com operação móvel e sincronização offline.
- [Agrotools — inteligência territorial](https://agrotools.com.br/agtech-para-agronegocio/): monitoramento remoto, risco territorial, alertas e decisão baseada em evidências.
- [ZapSign — criação de documento](https://docs.zapsign.com.br/documentos/criar-documento): links individuais, envio automático por e-mail quando configurado e autenticação por assinatura em tela combinada com token de e-mail ou SMS.

As referências orientam padrões de jornada e controle; textos, identidade, regras de negócio e implementação do ConectCampo permanecem próprios.
