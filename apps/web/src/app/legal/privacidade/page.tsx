import { PublicLayout } from '@/components/landing/PublicLayout';

export default function PrivacidadePage() {
  return (
    <PublicLayout>
      <section className="bg-gray-50 dark:bg-dark-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Última atualização: fevereiro de 2026</p>
        </div>
      </section>

      <article className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert prose-headings:font-bold prose-a:text-brand-600 max-w-none">

          <h2>1. Quem somos</h2>
          <p>
            A ConectCampo Tecnologia Ltda. é controladora dos dados pessoais coletados por meio da
            Plataforma ConectCampo. CNPJ: [em constituição]. Contato do encarregado (DPO):
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
          </ul>

          <h2>3. Como utilizamos seus dados</h2>
          <ul>
            <li>Cadastro e autenticação na plataforma;</li>
            <li>Cálculo do Score ConectCampo;</li>
            <li>Matching com instituições financeiras parceiras;</li>
            <li>Cumprimento de obrigações legais e regulatórias;</li>
            <li>Prevenção a fraudes e lavagem de dinheiro (KYC/AML);</li>
            <li>Melhoria contínua dos nossos serviços.</li>
          </ul>

          <h2>4. Compartilhamento de dados</h2>
          <p>
            Seus dados podem ser compartilhados apenas com: (i) instituições financeiras parceiras,
            para viabilizar operações de crédito que você solicitar; (ii) prestadores de serviços
            essenciais (cloud, análise de dados) sob acordos de confidencialidade; (iii) autoridades
            competentes quando exigido por lei (Banco Central, Receita Federal, etc.).
            <strong> Nunca vendemos seus dados a terceiros.</strong>
          </p>

          <h2>5. Seus direitos (LGPD)</h2>
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

          <h2>6. Retenção de dados</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para a prestação do serviço e cumprimento de
            obrigações legais, geralmente por no mínimo 5 anos após o encerramento da relação
            contratual, conforme exigências do Banco Central e da Receita Federal.
          </p>

          <h2>7. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de performance
            (Analytics) e cookies de preferência (tema). Você pode gerenciar cookies nas configurações
            do seu navegador, mas isso pode afetar o funcionamento de alguns recursos.
          </p>

          <h2>8. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
            acesso não autorizado, perda, destruição ou divulgação indevida, incluindo criptografia
            TLS em trânsito e criptografia em repouso para dados sensíveis.
          </p>

          <h2>9. Contato</h2>
          <p>Encarregado de Proteção de Dados (DPO): privacidade@conectcampo.com.br</p>
        </div>
      </article>
    </PublicLayout>
  );
}
