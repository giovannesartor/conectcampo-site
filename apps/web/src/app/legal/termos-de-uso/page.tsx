import { PublicLayout } from '@/components/landing/PublicLayout';

export default function TermosDeUsoPage() {
  return (
    <PublicLayout>
      <section className="bg-gray-50 dark:bg-dark-card px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Termos de Uso</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Última atualização: fevereiro de 2026</p>
        </div>
      </section>

      <article className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl prose prose-gray dark:prose-invert prose-headings:font-bold prose-a:text-brand-600 max-w-none">

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou utilizar a plataforma ConectCampo ("Plataforma"), operada pela
            ConectCampo Tecnologia Ltda. ("Empresa"), você concorda em cumprir e estar vinculado a
            estes Termos de Uso ("Termos"). Se você não concordar com qualquer parte destes Termos,
            não poderá utilizar a Plataforma.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            A ConectCampo é um marketplace digital que conecta produtores rurais, empresas do
            agronegócio e instituições financeiras para facilitar operações de crédito rural. A
            Empresa não é uma instituição financeira e não concede crédito diretamente.
          </p>

          <h2>3. Elegibilidade</h2>
          <p>
            Para utilizar a Plataforma, você deve: (i) ter capacidade civil plena; (ii) ser residente
            no Brasil; (iii) fornecer informações verdadeiras, precisas e completas durante o
            cadastro; (iv) aceitar a Política de Privacidade e os termos de LGPD.
          </p>

          <h2>4. Cadastro e Segurança da Conta</h2>
          <p>
            Você é responsável por manter a confidencialidade de suas credenciais de acesso. Qualquer
            atividade realizada com sua conta é de sua responsabilidade. Notifique-nos imediatamente
            em caso de uso não autorizado através do e-mail segurança@conectcampo.com.br.
          </p>

          <h2>5. Uso Aceitável</h2>
          <p>É expressamente vedado:</p>
          <ul>
            <li>Fornecer informações falsas ou enganosas;</li>
            <li>Utilizar a Plataforma para fins ilícitos ou fraudulentos;</li>
            <li>Tentar acessar dados de outros usuários sem autorização;</li>
            <li>Realizar engenharia reversa ou descompilar o software;</li>
            <li>Praticar lavagem de dinheiro ou qualquer crime financeiro.</li>
          </ul>

          <h2>6. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo da Plataforma, incluindo textos, gráficos, logotipos, ícones, imagens e
            software, é de propriedade exclusiva da ConectCampo ou de seus licenciadores e está
            protegido pelas leis brasileiras de propriedade intelectual.
          </p>

          <h2>7. Limitação de Responsabilidade</h2>
          <p>
            A ConectCampo não se responsabiliza por decisões de crédito tomadas pelas instituições
            financeiras parceiras, por perdas resultantes de operações financeiras, ou por
            indisponibilidades temporárias da Plataforma por razões de manutenção ou força maior.
          </p>

          <h2>8. Alterações dos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações
            entrarão em vigor 15 dias após a publicação. O uso continuado da Plataforma após esse
            período constituirá aceite das novas condições.
          </p>

          <h2>9. Lei Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
            foro da Comarca de São Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias.
          </p>

          <h2>10. Contato</h2>
          <p>
            Dúvidas sobre estes Termos? Entre em contato: legal@conectcampo.com.br
          </p>
        </div>
      </article>
    </PublicLayout>
  );
}
