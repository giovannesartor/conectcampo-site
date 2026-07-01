export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readingMinutes: number;
  category: string;
  /** Conteúdo em HTML (curado pela própria ConectCampo). */
  html: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'o-que-e-cpr-cedula-de-produto-rural',
    title: 'O que é CPR (Cédula de Produto Rural) e como usar para captar crédito',
    excerpt:
      'Entenda o que é a Cédula de Produto Rural, os tipos física e financeira, e como o produtor usa a CPR para antecipar recursos e captar crédito no agro.',
    date: '2026-06-10',
    readingMinutes: 6,
    category: 'Crédito Rural',
    html: `
      <p>A <strong>Cédula de Produto Rural (CPR)</strong> é um dos instrumentos mais importantes do financiamento do agronegócio brasileiro. Criada pela Lei nº 8.929/1994 e modernizada pela Lei nº 13.986/2020, a CPR é um título de crédito pelo qual o produtor rural (ou cooperativa) se compromete a entregar um produto ou seu equivalente financeiro em uma data futura.</p>
      <h2>CPR Física x CPR Financeira</h2>
      <p>Na <strong>CPR Física</strong>, o emitente compromete-se a entregar o produto (soja, milho, café, boi gordo etc.) na quantidade e local combinados. Na <strong>CPR Financeira</strong>, a liquidação é feita em dinheiro, com base em um preço ou índice de referência — o que dá mais flexibilidade e é muito usado para captação.</p>
      <h2>Por que a CPR é tão usada?</h2>
      <p>A CPR permite que o produtor <strong>antecipe recursos</strong> antes da colheita, dando previsibilidade de fluxo de caixa. Ela pode ser usada como garantia em operações de crédito, negociada com bancos, FIDCs, securitizadoras e tradings, e registrada em entidade registradora para ganhar eficácia como título executivo.</p>
      <h2>Prazo, carência e safras</h2>
      <p>Uma CPR pode ter prazos longos (até 15 anos em algumas estruturas), com <strong>carência</strong> e vinculação a uma ou mais <strong>safras</strong>. Isso permite casar o vencimento com o ciclo produtivo da propriedade.</p>
      <h2>Como emitir uma CPR na ConectCampo</h2>
      <p>Na plataforma, o produtor preenche os dados do emitente e do credor, o produto e as garantias, define prazo/carência/safras, e gera a minuta. A assinatura é eletrônica (com trilha de auditoria), e o custo de emissão é transparente. Depois, a CPR pode ser usada para <strong>captar crédito</strong> com as instituições parceiras.</p>
      <p><em>Este conteúdo é informativo e não constitui aconselhamento jurídico ou financeiro.</em></p>
    `,
  },
  {
    slug: 'fidc-cra-fiagro-como-funciona-credito-agro',
    title: 'FIDC, CRA e FIAGRO: como o mercado de capitais financia o agro',
    excerpt:
      'FIDCs, CRAs e FIAGROs movimentam bilhões no crédito agro. Entenda o que é cada um e quando fazem sentido para a sua operação.',
    date: '2026-06-18',
    readingMinutes: 7,
    category: 'Mercado de Capitais',
    html: `
      <p>Além de bancos e cooperativas, o agro brasileiro é cada vez mais financiado pelo <strong>mercado de capitais</strong>. Três estruturas se destacam: FIDC, CRA e FIAGRO.</p>
      <h2>FIDC — Fundo de Investimento em Direitos Creditórios</h2>
      <p>O FIDC compra recebíveis (como CPRs e duplicatas) e antecipa recursos ao produtor. É flexível e muito usado para custeio e capital de giro, especialmente para produtores de médio e grande porte.</p>
      <h2>CRA — Certificado de Recebíveis do Agronegócio</h2>
      <p>O CRA é um título de renda fixa lastreado em recebíveis do agro, emitido por securitizadoras e distribuído a investidores. É isento de imposto de renda para pessoa física, o que atrai capital e barateia o custo para operações maiores.</p>
      <h2>FIAGRO — Fundo de Investimento nas Cadeias Agroindustriais</h2>
      <p>O FIAGRO é um veículo relativamente novo que pode investir em terras, direitos creditórios, participações e ativos do agro. Democratizou o acesso do investidor ao setor e ampliou as fontes de funding.</p>
      <h2>Qual faz sentido para você?</h2>
      <p>Depende do porte, das garantias e do objetivo. É exatamente aí que um <strong>marketplace multi-financiador</strong> ajuda: em vez de bater na porta de um credor por vez, o produtor tem seu perfil cruzado com dezenas de instituições e compara as melhores condições.</p>
    `,
  },
  {
    slug: 'como-melhorar-score-credito-rural',
    title: '7 formas de melhorar seu score de crédito rural',
    excerpt:
      'Garantias, histórico, fluxo de caixa e seguro: veja o que mais pesa no score de crédito agro e como melhorar as suas condições.',
    date: '2026-06-25',
    readingMinutes: 5,
    category: 'Score & Crédito',
    html: `
      <p>O <strong>score de crédito</strong> resume, em um número, o quão atraente é o seu perfil para os financiadores. Quanto melhor o score, melhores as taxas e prazos. Veja o que mais pesa e como melhorar:</p>
      <ol>
        <li><strong>Garantias:</strong> aumente a cobertura (imóvel rural, penhor de safra, aval) frente ao valor pedido.</li>
        <li><strong>Histórico produtivo:</strong> registre safras e produtividade — consistência vale muito.</li>
        <li><strong>Endividamento:</strong> reduza a relação dívida/receita quitando ou renegociando passivos.</li>
        <li><strong>Fluxo de caixa:</strong> comprove caixa regular e suficiente com extratos e projeções.</li>
        <li><strong>Histórico de crédito:</strong> mantenha pagamentos em dia e regularize restrições.</li>
        <li><strong>Seguro rural:</strong> ter seguro demonstra gestão de risco e melhora o rating.</li>
        <li><strong>Documentação completa:</strong> DRE, balanço e certidões atualizadas passam confiança.</li>
      </ol>
      <p>Na ConectCampo, o Score é calculado de forma transparente e você recebe uma explicação em linguagem natural do que fazer para subir a pontuação.</p>
    `,
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}
