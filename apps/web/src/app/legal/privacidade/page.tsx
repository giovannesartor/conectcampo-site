import { PublicLayout } from '@/components/landing/PublicLayout';

export default function PrivacidadePage() {
  return (
    <PublicLayout>
      <section className="bg-gray-50 dark:bg-dark-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Última atualização: setembro de 2026</p>
        </div>
      </section>

      <article className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert prose-headings:font-bold prose-a:text-brand-600 max-w-none">

          <h2>1. Quem somos</h2>
          <p>
            A AG Participações Societárias Ltda. — AG Digital, inscrita no CNPJ sob o nº
            54.079.299/0001-40, é a controladora dos dados pessoais coletados por meio da
            Plataforma ConectCampo, um produto da AG Digital. Contato do encarregado (DPO):
            privacidade@conectcampo.com.br
          </p>

          <h2>2. Dados que coletamos</h2>
          <p>Coletamos os seguintes dados para a prestação dos nossos serviços:</p>
          <ul>
            <li><strong>Dados de identificação:</strong> nome, CPF/CNPJ, data de nascimento, e-mail, telefone;</li>
            <li><strong>Dados financeiros:</strong> balanço patrimonial, declaração de renda, histórico de crédito;</li>
            <li><strong>Dados agronômicos:</strong> área produtiva, localização de propriedades, histórico de safras;</li>
            <li><strong>Dados de acesso:</strong> endereço IP, tipo de dispositivo, navegador, cookies de sessão;</li>
            <li><strong>Documentos:</strong> contratos, certidões, matrículas e comprovantes enviados à plataforma.</li>
            <li><strong>Dados do aplicativo:</strong> identificador de conta, token do dispositivo para notificações, versão do app, eventos de desempenho e falhas técnicas;</li>
            <li><strong>Compras no iOS:</strong> produto, situação da assinatura e identificadores de transação fornecidos pela Apple. A ConectCampo não recebe os dados do cartão cadastrado na App Store.</li>
          </ul>

          <h2>3. Recursos do aplicativo móvel</h2>
          <ul>
            <li><strong>Câmera e fotos:</strong> acessadas somente quando você escolhe digitalizar, anexar ou salvar um documento;</li>
            <li><strong>Face ID, Touch ID ou código do aparelho:</strong> a confirmação ocorre no próprio iPhone. A ConectCampo não recebe nem armazena os dados biométricos;</li>
            <li><strong>Notificações:</strong> são opcionais e usam um token técnico vinculado à conta para entregar alertas de propostas, documentos, CPRs e vencimentos;</li>
            <li><strong>Localização rural:</strong> dados de propriedades e talhões podem ser informados pelo usuário para recursos agrícolas, climáticos e de satélite. O app não coleta localização contínua em segundo plano.</li>
          </ul>

          <h2>4. Como utilizamos seus dados</h2>
          <ul>
            <li>Cadastro e autenticação na plataforma;</li>
            <li>Cálculo do Score ConectCampo;</li>
            <li>Matching com instituições financeiras parceiras;</li>
            <li>Cumprimento de obrigações legais e regulatórias;</li>
            <li>Prevenção a fraudes e lavagem de dinheiro (KYC/AML);</li>
            <li>Melhoria contínua dos nossos serviços.</li>
          </ul>

          <h2>5. Compartilhamento de dados</h2>
          <p>
            Seus dados podem ser compartilhados, de forma compatível com o serviço solicitado, com: (i) instituições financeiras parceiras,
            para viabilizar operações de crédito que você solicitar; (ii) prestadores de serviços
            essenciais, como hospedagem, armazenamento, e-mail, pagamentos, assinatura eletrônica e análise de dados,
            sob contratos e deveres de confidencialidade; (iii) Apple, para processar assinaturas realizadas no iOS; (iv) autoridades
            competentes quando exigido por lei (Banco Central, Receita Federal, etc.).
            <strong> Nunca vendemos seus dados a terceiros.</strong>
          </p>

          <h2>6. Rastreamento e publicidade</h2>
          <p>
            O aplicativo não usa redes de publicidade e não rastreia sua atividade entre apps ou sites de outras empresas para publicidade direcionada.
            Métricas técnicas e de uso da própria plataforma podem ser tratadas para segurança, prevenção a fraudes, suporte e melhoria do serviço.
          </p>

          <h2>7. Seus direitos (LGPD)</h2>
          <p>Conforme a Lei nº 13.709/2018, você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar seus dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização ou eliminação de dados desnecessários;</li>
            <li>Revogar o consentimento a qualquer momento;</li>
            <li>Portabilidade dos dados para outro fornecedor.</li>
          </ul>
          <p>Para exercer esses direitos: privacidade@conectcampo.com.br</p>
          <p>
            A exclusão da conta pode ser iniciada diretamente em <strong>Perfil → Configurações → Conta</strong>.
            A conta é bloqueada, as sessões são revogadas e os dados de identificação são anonimizados, ressalvados os registros cuja retenção seja necessária para cumprir obrigação legal, regulatória, contratual ou para o exercício regular de direitos.
          </p>

          <h2>8. Retenção de dados</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para a prestação do serviço e cumprimento de
            obrigações legais, geralmente por no mínimo 5 anos após o encerramento da relação
            contratual, conforme exigências do Banco Central e da Receita Federal.
          </p>

          <h2>9. Cookies e armazenamento local</h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de performance
            e armazenamento de preferências, como tema e sessão. Você pode gerenciar esses dados nas configurações
            do navegador ou do aparelho, mas isso pode afetar o funcionamento de alguns recursos.
          </p>

          <h2>10. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
            acesso não autorizado, perda, destruição ou divulgação indevida, incluindo criptografia
            TLS em trânsito e criptografia em repouso para dados sensíveis.
          </p>

          <h2>11. Contato</h2>
          <p>Encarregado de Proteção de Dados (DPO): privacidade@conectcampo.com.br</p>
        </div>
      </article>
    </PublicLayout>
  );
}
