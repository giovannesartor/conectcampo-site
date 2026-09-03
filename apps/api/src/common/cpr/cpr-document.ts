export interface CprInstallment {
  numero?: number;
  vencimento?: string;
  principal?: number;
  encargos?: number;
  total?: number;
}

export interface CprGuarantor {
  nome?: string;
  cpfCnpj?: string;
  qualificacao?: string;
  endereco?: string;
  email?: string;
  telefone?: string;
}

export interface CprSignatureParty extends CprGuarantor {
  externalId?: string;
  qualification?: string;
  token?: string | null;
  signUrl?: string | null;
  signedAt?: string | null;
  status?: string | null;
}

export interface CprContractData {
  localEmissao?: string;
  dataEmissao?: string;
  emitenteQualificacao?: string;
  emitenteCep?: string;
  emitenteRepresentante?: string;
  emitenteBanco?: string;
  emitenteAgencia?: string;
  emitenteConta?: string;
  credorQualificacao?: string;
  credorEndereco?: string;
  credorCidade?: string;
  credorEstado?: string;
  credorCep?: string;
  credorRepresentante?: string;
  avalistas?: CprGuarantor[];
  produtoQualidade?: string;
  produtoPadrao?: string;
  propriedadeNome?: string;
  propriedadeEndereco?: string;
  propriedadeMatricula?: string;
  armazenamentoNome?: string;
  armazenamentoEndereco?: string;
  indicePreco?: string;
  fontePreco?: string;
  mercadoReferencia?: string;
  criterioSubstituicaoIndice?: string;
  taxaJurosMensal?: number;
  taxaJurosAnual?: number;
  cetMensal?: number;
  cetAnual?: number;
  capitalizacao?: string;
  sistemaAmortizacao?: string;
  periodicidadePagamento?: string;
  baseCalculoDias?: number;
  multaMoraPct?: number;
  jurosMoraMensalPct?: number;
  encargosAdicionais?: string;
  valorCredito?: number;
  valorIof?: number;
  valorLiquido?: number;
  valorResgate?: number;
  beneficiarioLiberacao?: string;
  condicoesPrecedentes?: string;
  comprovacaoDestinacao?: string;
  formaLiquidacao?: string;
  localPagamento?: string;
  cronograma?: CprInstallment[];
  garantiaProprietario?: string;
  garantiaRegistro?: string;
  garantiaGrau?: string;
  garantiaCartorio?: string;
  garantiaAreaHectares?: number;
  garantiaOnus?: string;
  garantiaAnuencias?: string;
  garantiaDocumentos?: string;
  prazoCuraDias?: number;
  avisoVistoriaDias?: number;
  formulaLiquidacaoAntecipada?: string;
  registradora?: string;
  numeroRegistro?: string;
  dataRegistro?: string;
  foroCidade?: string;
  foroEstado?: string;
  contatoNotificacoes?: string;
  canalOuvidoria?: string;
  testemunhas?: CprGuarantor[];
  signatureParties?: CprSignatureParty[];
  minutaExemplo?: boolean;
}

export interface CprClause {
  title: string;
  body: string;
}

export function cprContractData(c: any): CprContractData {
  const value = c?.contractData;
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as CprContractData)
    : {};
}

export function brl(value: unknown): string {
  if (value == null || value === '') return 'Não informado';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Não informado';
  return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function dateBR(value: unknown): string {
  if (!value) return 'Não informado';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function numberBR(value: unknown, digits = 2): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Não informado';
  return numeric.toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

export function percentBR(value: unknown, suffix: string): string {
  if (value == null || value === '') return 'Não informado';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Não informado';
  return `${numberBR(numeric)}% ${suffix}`;
}

export function getFaceValue(c: any): number | null {
  const value = c?.valorFace ?? c?.valorTotal;
  if (value == null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function getPaymentSchedule(c: any): CprInstallment[] {
  const data = cprContractData(c);
  if (Array.isArray(data.cronograma) && data.cronograma.length > 0) {
    return data.cronograma.map((item, index) => ({
      numero: item.numero ?? index + 1,
      vencimento: item.vencimento,
      principal: item.principal,
      encargos: item.encargos,
      total: item.total ?? ((item.principal ?? 0) + (item.encargos ?? 0)),
    }));
  }

  return [{
    numero: 1,
    vencimento: c?.dataVencimento,
    principal: getFaceValue(c) ?? undefined,
    encargos: 0,
    total: getFaceValue(c) ?? undefined,
  }];
}

function place(c: any): string {
  const data = cprContractData(c);
  return data.localEmissao || [c?.emitenteCidade, c?.emitenteEstado].filter(Boolean).join('/ ') || 'local a definir';
}

function guarantorLabel(c: any): string {
  const data = cprContractData(c);
  if (!data.avalistas?.length) return 'Não há avalistas cadastrados nesta minuta.';
  return data.avalistas
    .map((item) => `${item.nome || 'Avalista sem nome'} (${item.cpfCnpj || 'documento não informado'})`)
    .join('; ');
}

export function getCprClauses(c: any): CprClause[] {
  const data = cprContractData(c);
  const isFinancial = c?.type !== 'FISICA';
  const faceValue = brl(getFaceValue(c));
  const product = `${c?.produto || 'produto não informado'}, na quantidade de ${numberBR(c?.quantidade, 4)} ${c?.unidade || 'unidades'}`;
  const maturity = dateBR(c?.dataVencimento);
  const delivery = c?.localEntrega || data.propriedadeEndereco || 'local a definir';
  const priceReference = [data.indicePreco, data.fontePreco, data.mercadoReferencia].filter(Boolean).join(' · ') || 'critérios descritos no quadro-resumo';
  const registry = data.registradora
    ? `${data.registradora}${data.numeroRegistro ? `, sob nº ${data.numeroRegistro}` : ''}`
    : 'entidade autorizada aplicável à operação';
  const creditValue = brl(data.valorCredito ?? c?.valorCaptacao ?? getFaceValue(c));
  const netValue = brl(data.valorLiquido);
  const releaseBeneficiary = data.beneficiarioLiberacao || c?.emitenteNome || 'beneficiário a confirmar';
  const grace = c?.carenciaMeses != null ? `${numberBR(c.carenciaMeses, 0)} meses` : 'não informada';
  const term = c?.prazoMeses != null ? `${numberBR(c.prazoMeses, 0)} meses` : `até ${maturity}`;
  const cureDays = data.prazoCuraDias != null ? `${numberBR(data.prazoCuraDias, 0)} dias` : 'prazo aplicável indicado na notificação';
  const inspectionNotice = data.avisoVistoriaDias != null ? `${numberBR(data.avisoVistoriaDias, 0)} dias` : 'antecedência razoável';
  const guaranteeRecord = [data.garantiaRegistro, data.garantiaCartorio, data.garantiaGrau].filter(Boolean).join(' · ') || 'dados registrais a confirmar';

  return [
    {
      title: 'Natureza, emissão e cláusula à ordem',
      body: `Esta Cédula de Produto Rural (“CPR”), emitida em ${place(c)}, constitui promessa pura e simples do EMITENTE em favor do CREDOR, com cláusula à ordem, regendo-se pela Lei nº 8.929/1994, suas alterações e pelas condições desta cédula. A numeração definitiva é atribuída na emissão, e qualquer versão anterior permanece identificada como minuta.`,
    },
    {
      title: isFinancial ? 'Objeto e liquidação financeira' : 'Objeto e entrega física',
      body: isFinancial
        ? `O EMITENTE promete pagar ao CREDOR, no vencimento e conforme o cronograma, o valor resultante da liquidação financeira do produto de referência: ${product}. O valor de face é ${faceValue}, observados os critérios de apuração e atualização aqui indicados.`
        : `O EMITENTE promete entregar ao CREDOR o seguinte produto rural: ${product}, na qualidade e no padrão contratados, no local ${delivery}, nas datas e condições previstas nesta cédula.`,
    },
    {
      title: 'Valor de face, crédito e valor de resgate',
      body: `O valor de face é ${faceValue}; o crédito bruto informado é ${creditValue}; o IOF indicado é ${brl(data.valorIof)}; e o valor líquido estimado é ${netValue}. O valor de resgate será ${brl(data.valorResgate ?? getFaceValue(c))}, ou o saldo apurado pela memória de cálculo e pelo cronograma. Diferenças entre esses valores não serão tratadas como tarifa automática e deverão ser explicadas antes da assinatura.`,
    },
    {
      title: 'Produto, qualidade, preço e critérios de apuração',
      body: `O produto vinculado é ${product}, referente à(s) safra(s) ${c?.safraAno || 'não informada(s)'}, com qualidade ${data.produtoQualidade || 'a definir'} e padrão/classificação ${data.produtoPadrao || 'a definir'}. O preço ou índice seguirá ${priceReference}. A substituição da fonte observará ${data.criterioSubstituicaoIndice || 'equivalência econômica, verificabilidade e formalização entre as partes'}.`,
    },
    {
      title: 'Prazo, carência e encargos remuneratórios',
      body: `O prazo total é ${term}, com carência de ${grace}. Taxa mensal: ${percentBR(data.taxaJurosMensal, 'a.m.')}; taxa anual: ${percentBR(data.taxaJurosAnual, 'a.a.')}; CET mensal: ${percentBR(data.cetMensal, 'a.m.')}; CET anual: ${percentBR(data.cetAnual, 'a.a.')}. A capitalização seguirá ${data.capitalizacao || 'a regra expressamente indicada na memória de cálculo'}, pelo sistema ${data.sistemaAmortizacao || 'a definir'}, com base de ${data.baseCalculoDias || 'dias a definir'} dias.`,
    },
    {
      title: 'Liberação dos recursos e condições precedentes',
      body: `A liberação será feita em favor de ${releaseBeneficiary}, na conta informada no quadro-resumo ou em instrução formal aceita pelo CREDOR. As condições precedentes são ${data.condicoesPrecedentes || 'assinatura válida, conferência documental, formalização das garantias e inexistência de evento de vencimento antecipado'}. O comprovante de transferência integrará a trilha da operação.`,
    },
    {
      title: 'Destinação e comprovação dos recursos',
      body: `Os recursos serão destinados a ${c?.finalidade || 'finalidade agropecuária a confirmar'}. A comprovação seguirá ${data.comprovacaoDestinacao || 'documentos fiscais, contratos, recibos e demais evidências razoavelmente relacionadas à finalidade declarada'}, respeitados os prazos, a confidencialidade e a proporcionalidade.`,
    },
    {
      title: 'Cronograma, forma e local de liquidação',
      body: `A liquidação ocorrerá por ${data.formaLiquidacao || (isFinancial ? 'transferência bancária' : 'entrega física do produto')}, no local ${data.localPagamento || delivery}, com periodicidade ${data.periodicidadePagamento || 'definida no cronograma'}, até ${maturity}. O pagamento somente será considerado quitado após disponibilidade definitiva dos recursos ou aceite da entrega pelo CREDOR.`,
    },
    {
      title: 'Garantias e formalização',
      body: `A garantia cadastrada é ${c?.garantiaTipo || 'não informada'}, descrita como ${c?.garantiaDescricao || 'não informada'}, no valor declarado de ${brl(c?.garantiaValor)}. Proprietário/garantidor: ${data.garantiaProprietario || 'não informado'}; dados registrais: ${guaranteeRecord}. As garantias dependerão dos instrumentos, anuências, avaliações e registros exigíveis.`,
    },
    {
      title: 'Alienação fiduciária de imóveis rurais',
      body: `Quando a garantia envolver alienação fiduciária, sua constituição dependerá do instrumento próprio e do registro na matrícula indicada em ${data.garantiaRegistro || 'campo a preencher'}, perante ${data.garantiaCartorio || 'cartório competente'}. A área informada é ${data.garantiaAreaHectares != null ? `${numberBR(data.garantiaAreaHectares, 4)} hectares` : 'não informada'}. Ônus: ${data.garantiaOnus || 'a confirmar'}. Anuências: ${data.garantiaAnuencias || 'a confirmar'}.`,
    },
    {
      title: 'Aval e responsabilidade dos garantidores',
      body: `Os avalistas e garantidores identificados nesta CPR — ${guarantorLabel(c)} — assumem as obrigações nos limites do aval ou da garantia efetivamente prestados, após ciência do valor, prazo, encargos, hipóteses de vencimento antecipado e riscos patrimoniais. Consentimentos conjugais e poderes de representação serão colhidos quando exigíveis.`,
    },
    {
      title: 'Conservação, reforço e substituição de garantias',
      body: `O EMITENTE e os garantidores conservarão o produto e os bens, manterão documentos e obrigações regulares e comunicarão deterioração, perda, novo ônus ou fato que reduza valor ou liquidez. Reforço ou substituição somente será exigido por critério objetivo e formalizado. Documentos previstos: ${data.garantiaDocumentos || 'matrículas, certidões, laudos e cadastros aplicáveis'}.`,
    },
    {
      title: 'Compensação e imputação',
      body: 'Quando permitido pela legislação e pela natureza das partes, créditos líquidos, certos e exigíveis poderão ser compensados mediante demonstrativo. Pagamentos parciais serão imputados segundo a ordem legal ou a ordem expressamente acordada, sem novação do saldo remanescente.',
    },
    {
      title: 'Mora e encargos de inadimplemento',
      body: `O atraso constitui o EMITENTE em mora na forma aplicável. Quando expressamente contratados, incidirão multa de ${percentBR(data.multaMoraPct, '')}, juros de mora de ${percentBR(data.jurosMoraMensalPct, 'a.m.')} e ${data.encargosAdicionais || 'demais encargos indicados no quadro financeiro'}. Despesas de cobrança deverão ser razoáveis e comprovadas; nenhum encargo em branco será presumido.`,
    },
    {
      title: 'Declarações das partes',
      body: 'As partes declaram capacidade e poderes para contratar, veracidade dos dados e documentos, licitude da origem e destinação dos recursos, inexistência de ônus omitidos e ciência de que campos pendentes impedem a emissão definitiva. O aceite da minuta não equivale a aprovação automática de crédito ou de garantia.',
    },
    {
      title: 'Vencimento antecipado',
      body: `O CREDOR poderá declarar vencidas as obrigações por inadimplemento pecuniário; falsidade ou omissão relevante; desvio de finalidade; perda, alienação ou oneração indevida de garantia; insolvência, recuperação, falência ou dissolução; protesto material não regularizado; ilícito socioambiental grave; ou descumprimento essencial não sanado em ${cureDays}. A aplicação observará materialidade, notificações e competências legais.`,
    },
    {
      title: 'Direito de vistoria',
      body: `O CREDOR poderá vistoriar o produto, a produção, os locais de armazenamento e as garantias mediante aviso de ${inspectionNotice}, preservando segurança, atividade produtiva, confidencialidade e proporcionalidade. Irregularidades serão documentadas e, quando cabível, terão prazo de correção.`,
    },
    {
      title: 'Liquidação antecipada',
      body: `O EMITENTE poderá solicitar liquidação total ou parcial. O CREDOR apresentará saldo e memória de cálculo. Eventual custo de ruptura seguirá ${data.formulaLiquidacaoAntecipada || 'fórmula objetiva previamente pactuada, demonstrada e permitida pela legislação aplicável'}, sem cobrança automática de valor não previsto.`,
    },
    {
      title: 'Cessão, endosso e securitização',
      body: 'A CPR poderá ser transferida, cedida, endossada, securitizada ou oferecida em garantia, total ou parcialmente, observadas a cadeia de titularidade, as garantias, o registro ou depósito e os limites legais. O sucessor respeitará os dados essenciais e os direitos constituídos.',
    },
    {
      title: 'Registro, depósito e custódia',
      body: `A CPR e seus eventos relevantes serão registrados ou depositados perante ${registry}, quando exigível. Garantias reais e atos acessórios serão levados aos registros competentes. O status exibido pela ConectCampo é operacional e não substitui comprovante oficial da registradora ou do cartório.`,
    },
    {
      title: 'Aditivos e alterações',
      body: 'Alterações materiais dependerão de aditivo assinado ou mecanismo eletrônico auditável e, quando necessário, de novo registro. A versão, a data e os participantes de cada mudança permanecerão rastreáveis.',
    },
    {
      title: 'Tolerância e nulidade parcial',
      body: 'A tolerância não implica renúncia, novação, perdão ou alteração contratual. A eventual invalidade de uma disposição não prejudicará as demais, que permanecerão eficazes na máxima extensão permitida.',
    },
    {
      title: 'Tributos, emolumentos e despesas',
      body: `${isFinancial ? `O custo de emissão ConectCampo corresponde a 0,8% do valor de face, totalizando ${brl(c?.custoEmissao)}` : `O custo de emissão ConectCampo totaliza ${brl(c?.custoEmissao)}`}. Tributos, emolumentos, registros, avaliações e despesas de terceiros são valores distintos e serão atribuídos de forma transparente no instrumento definitivo.`,
    },
    {
      title: 'Obrigações socioambientais e trabalhistas',
      body: 'As partes comprometem-se a observar a legislação ambiental, agrária, trabalhista e de saúde e segurança, incluindo a vedação de trabalho infantil, análogo ao escravo e de práticas discriminatórias. Ocorrências materiais relacionadas à produção ou às garantias deverão ser informadas sem demora indevida.',
    },
    {
      title: 'Anticorrupção',
      body: 'As partes declaram observar as normas anticorrupção aplicáveis, manter controles proporcionais e não oferecer, prometer ou aceitar vantagem indevida relacionada à operação. Violações materiais deverão ser comunicadas e apuradas.',
    },
    {
      title: 'Prevenção à lavagem de dinheiro e sanções',
      body: 'As partes cooperarão com verificações de identidade, beneficiário final, origem de recursos e sanções legalmente aplicáveis. A recusa ou suspensão de uma operação observará os deveres legais e as políticas validamente comunicadas.',
    },
    {
      title: 'Sistema de Informações de Crédito - SCR',
      body: 'Consultas ou comunicações ao SCR somente serão realizadas por parte legitimada, com base legal, autorização quando exigida e deveres de informação próprios. A ConectCampo não consulta nem registra automaticamente dados no SCR por esta minuta.',
    },
    {
      title: 'Consulta a sistemas de registro',
      body: 'A parte legitimada poderá consultar sistemas autorizados de registro ou depósito para verificar existência, titularidade e eventos da CPR, observadas finalidade, segurança, sigilo e legislação de proteção de dados.',
    },
    {
      title: 'Cadastros de inadimplência',
      body: 'A comunicação a cadastros restritivos somente poderá ser feita pelo credor legitimado, após inadimplemento e cumprimento das notificações e requisitos legais. A plataforma não promove negativação automática.',
    },
    {
      title: 'Proteção de dados pessoais',
      body: 'Os dados pessoais serão tratados para formação, execução, assinatura, registro, prevenção a fraude e defesa de direitos, com controle de acesso, retenção proporcional e atendimento aos direitos previstos na Lei Geral de Proteção de Dados.',
    },
    {
      title: 'Comunicações',
      body: `Notificações serão enviadas aos contatos cadastrados, especialmente ${data.contatoNotificacoes || [c?.emitenteEmail, c?.credorEmail].filter(Boolean).join(' e ') || 'contatos a confirmar'}. Comunicações críticas manterão registro de envio, conteúdo, destinatário e confirmação disponível.`,
    },
    {
      title: 'Assinatura eletrônica e trilha de auditoria',
      body: 'As partes reconhecem assinaturas eletrônicas e evidências técnicas admitidas pela legislação, incluindo identificação do signatário, data, hora e trilha de auditoria. A ConectCampo ou a ZapSign gera links individuais; nenhuma assinatura é criada automaticamente em nome do signatário.',
    },
    {
      title: 'Ouvidoria e solução amigável',
      body: `Dúvidas e reclamações serão encaminhadas a ${data.canalOuvidoria || 'canal a preencher no instrumento definitivo'}. As partes buscarão solução negociada de boa-fé antes de medidas contenciosas, sem prejudicar direitos urgentes.`,
    },
    {
      title: 'Assunção de dívida',
      body: 'Eventual assunção de dívida dependerá de instrumento específico, consentimento do CREDOR e atendimento aos requisitos legais, sem liberação do devedor original salvo declaração expressa.',
    },
    {
      title: 'Natureza executiva e foro',
      body: `Atendidos os requisitos legais, a CPR poderá constituir título executivo extrajudicial. A exigibilidade dependerá do correto preenchimento, assinatura, comprovação do crédito, vencimento, memória do saldo e registros aplicáveis. Fica indicado o foro de ${data.foroCidade || c?.emitenteCidade || 'cidade a definir'}/${data.foroEstado || c?.emitenteEstado || 'UF'}, ressalvadas competências inderrogáveis e eventual convenção válida de arbitragem.`,
    },
  ];
}

function escapeHtml(value: unknown): string {
  return String(value ?? 'Não informado').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char] as string));
}

export function renderCprHtml(c: any): string {
  const data = cprContractData(c);
  const clauses = getCprClauses(c);
  const schedule = getPaymentSchedule(c);
  const type = c?.type === 'FISICA' ? 'CPR Física' : 'CPR Financeira';
  const draft = !c?.numeroCpr || c?.status === 'RASCUNHO';
  const faceValue = getFaceValue(c);
  const productReferenceValue = c?.precoUnitario != null && c?.quantidade != null
    ? Number(c.precoUnitario) * Number(c.quantidade)
    : null;
  const row = (label: string, value: unknown) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>CPR ${escapeHtml(c?.numeroCpr || 'Rascunho')}</title><style>
@page{size:A4;margin:16mm 15mm 18mm}*{box-sizing:border-box}body{margin:0;color:#142019;font:11px/1.5 Arial,sans-serif;background:#fff}.toolbar{position:sticky;top:0;z-index:2;display:flex;justify-content:center;gap:8px;padding:10px;background:#edf5ef;border-bottom:1px solid #dce9df}.toolbar button{border:0;border-radius:8px;background:#08783e;color:#fff;padding:9px 16px;font-weight:700;cursor:pointer}.page{position:relative;max-width:820px;margin:0 auto;padding:18px 26px}.watermark{position:fixed;z-index:0;left:14%;top:46%;transform:rotate(-34deg);font-size:58px;font-weight:800;color:rgba(8,120,62,.08);pointer-events:none}.page>*:not(.watermark){position:relative;z-index:1}.header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #08783e;padding-bottom:12px}.brand{font-size:22px;font-weight:800;color:#064c31}.brand small{display:block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#b07c25}.meta{text-align:right;color:#53635a}.meta b{display:block;color:#17251d}.notice{margin:14px 0;border:1px solid #e6bf73;border-radius:8px;background:#fff9eb;color:#785410;padding:9px 11px;font-weight:700}.title{text-align:center;margin:18px 0 14px}.title h1{margin:0;color:#173d2b;font-size:17px}.title p{margin:4px 0;color:#68766e}.section{margin:15px 0;break-inside:avoid}.section h2{margin:0 0 7px;padding:6px 9px;border-left:4px solid #08783e;background:#edf7f0;color:#075b35;font-size:10px;letter-spacing:.09em;text-transform:uppercase}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe8e1;padding:5px 7px;text-align:left;vertical-align:top}th{width:31%;background:#f7faf8;color:#526158;font-weight:600}td{color:#142019;font-weight:600}.schedule th{width:auto}.clause{break-inside:avoid;margin:0 0 10px}.clause h3{margin:0 0 2px;color:#173d2b;font-size:10.5px}.clause p{margin:0;text-align:justify}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:45px}.signature{border-top:1px solid #24342b;text-align:center;padding-top:6px}.footer{margin-top:24px;padding-top:9px;border-top:1px solid #dfe8e1;color:#65746b;font-size:8.5px}@media print{.toolbar{display:none}.page{padding:0}.clause,.section{break-inside:avoid}}
</style></head><body><div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div><main class="page">
${data.minutaExemplo ? '<div class="watermark">EXEMPLO FICTÍCIO</div>' : ''}
<header class="header"><div class="brand">ConectCampo<small>Documentos do agro</small></div><div class="meta"><b>${escapeHtml(c?.numeroCpr || 'Nº a atribuir')}</b>${escapeHtml(type)}<br/>Status: ${escapeHtml(c?.status || 'RASCUNHO')}</div></header>
${draft || data.minutaExemplo ? `<div class="notice">${data.minutaExemplo ? 'EXEMPLO FICTÍCIO — SEM VALIDADE JURÍDICA' : 'MINUTA PARA CONFERÊNCIA — REVISE TODOS OS CAMPOS ANTES DA ASSINATURA'}</div>` : ''}
<div class="title"><h1>CÉDULA DE PRODUTO RURAL — ${c?.type === 'FISICA' ? 'FÍSICA' : 'COM LIQUIDAÇÃO FINANCEIRA'}</h1><p>Lei nº 8.929/1994 e alterações posteriores · cláusula à ordem</p></div>
<section class="section"><h2>Identificação do título</h2><table>${row('Número', c?.numeroCpr || 'A atribuir')}${row('Local e data de emissão', `${data.localEmissao || [c?.emitenteCidade, c?.emitenteEstado].filter(Boolean).join('/') || 'Não informado'} · ${dateBR(data.dataEmissao || c?.createdAt)}`)}${row('Valor de face', brl(getFaceValue(c)))}${row('Vencimento final', dateBR(c?.dataVencimento))}${row('Finalidade declarada', c?.finalidade || (c?.purpose === 'CAPTACAO' ? 'Captação de crédito' : 'Emissão de CPR'))}</table></section>
<section class="section"><h2>Partes</h2><table>${row('Emitente', `${c?.emitenteNome || 'Não informado'} · ${c?.emitenteCpfCnpj || 'documento não informado'}`)}${row('Qualificação e endereço do emitente', `${data.emitenteQualificacao || 'Não informado'} · ${c?.emitenteEndereco || 'endereço não informado'} · ${c?.emitenteCidade || ''}/${c?.emitenteEstado || ''} · CEP ${data.emitenteCep || 'não informado'}`)}${row('Conta para liberação', [data.emitenteBanco, data.emitenteAgencia, data.emitenteConta].filter(Boolean).join(' · ') || 'Não informada')}${row('Credor', `${c?.credorNome || 'Não informado'} · ${c?.credorCpfCnpj || 'documento não informado'}`)}${row('Qualificação e endereço do credor', `${data.credorQualificacao || c?.credorTipo || 'Não informado'} · ${data.credorEndereco || 'endereço não informado'} · ${data.credorCidade || ''}/${data.credorEstado || ''} · CEP ${data.credorCep || 'não informado'}`)}${row('Avalistas / garantidores', guarantorLabel(c))}</table></section>
<section class="section"><h2>Produto, produção e armazenamento</h2><table>${row('Produto e quantidade', `${c?.produto || 'Não informado'} · ${numberBR(c?.quantidade, 4)} ${c?.unidade || ''}`)}${row('Safra, qualidade e padrão', `${c?.safraAno || 'Não informado'} · ${data.produtoQualidade || 'qualidade a definir'} · ${data.produtoPadrao || 'padrão a definir'}`)}${row('Produção', `${data.propriedadeNome || 'Não informado'} · ${data.propriedadeEndereco || 'local não informado'} · matrícula ${data.propriedadeMatricula || 'não informada'} · CAR ${c?.emitenteCarNumero || 'não informado'}`)}${row('Armazenamento', `${data.armazenamentoNome || 'Não informado'} · ${data.armazenamentoEndereco || 'endereço não informado'}`)}${row('Entrega', `${c?.localEntrega || 'Não informado'} · ${dateBR(c?.dataEntrega)}`)}${row('Preço / índice de referência', [brl(c?.precoUnitario), data.indicePreco, data.fontePreco, data.mercadoReferencia].filter(Boolean).join(' · '))}${row('Substituição do índice', data.criterioSubstituicaoIndice || 'Não informada')}</table></section>
<section class="section"><h2>Condições financeiras e custo de emissão</h2><table>${row('Valor de face', brl(getFaceValue(c)))}${row('Crédito bruto / IOF / líquido', `${brl(data.valorCredito ?? c?.valorCaptacao)} · ${brl(data.valorIof)} · ${brl(data.valorLiquido)}`)}${row('Valor de resgate previsto', brl(data.valorResgate ?? getFaceValue(c)))}${row('Taxas', `${percentBR(data.taxaJurosMensal, 'a.m.')} · ${percentBR(data.taxaJurosAnual, 'a.a.')}`)}${row('CET', `${percentBR(data.cetMensal, 'a.m.')} · ${percentBR(data.cetAnual, 'a.a.')}`)}${row('Capitalização / amortização', `${data.capitalizacao || 'Não informada'} · ${data.sistemaAmortizacao || 'sistema não informado'} · base ${data.baseCalculoDias || 'não informada'} dias`)}${row('Liberação / condições', `${data.beneficiarioLiberacao || c?.emitenteNome || 'Não informado'} · ${data.condicoesPrecedentes || 'condições não informadas'}`)}${row('Mora', `Multa ${percentBR(data.multaMoraPct, '')} · juros ${percentBR(data.jurosMoraMensalPct, 'a.m.')} · ${data.encargosAdicionais || 'demais encargos não informados'}`)}${row('Custo ConectCampo', c?.type === 'FINANCEIRA' ? `${brl(c?.custoEmissao)} · 0,8% do valor de face` : `${brl(c?.custoEmissao)} · valor fixo`)}</table></section>
<section class="section"><h2>Conferência automática dos valores</h2><table>${row('Produto x preço', productReferenceValue == null ? 'Pendente de dados' : `${numberBR(c?.quantidade, 4)} ${c?.unidade || ''} x ${brl(c?.precoUnitario)} = ${brl(productReferenceValue)}`)}${row('Valor de face', brl(faceValue))}${row('Conciliação', productReferenceValue == null || faceValue == null ? 'Pendente' : Math.abs(productReferenceValue - faceValue) < 0.01 ? 'Valores conciliados' : `Divergência de ${brl(faceValue - productReferenceValue)} - revisar`)}</table></section>
<section class="section"><h2>Cronograma de liquidação</h2><table class="schedule"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Principal</th><th>Encargos</th><th>Total</th></tr></thead><tbody>${schedule.map((item) => `<tr><td>${escapeHtml(item.numero)}</td><td>${escapeHtml(dateBR(item.vencimento))}</td><td>${escapeHtml(brl(item.principal))}</td><td>${escapeHtml(brl(item.encargos))}</td><td>${escapeHtml(brl(item.total))}</td></tr>`).join('')}</tbody></table></section>
<section class="section"><h2>Garantias e registro</h2><table>${row('Garantia', `${c?.garantiaTipo || 'Não informada'} · ${c?.garantiaDescricao || 'descrição não informada'} · ${brl(c?.garantiaValor)}`)}${row('Proprietário, registro e grau', `${data.garantiaProprietario || 'Não informado'} · ${data.garantiaRegistro || 'registro não informado'} · ${data.garantiaGrau || 'grau não informado'}`)}${row('Cartório / área', `${data.garantiaCartorio || 'Não informado'} · ${data.garantiaAreaHectares != null ? `${numberBR(data.garantiaAreaHectares, 4)} ha` : 'área não informada'}`)}${row('Ônus / anuências', `${data.garantiaOnus || 'Não informados'} · ${data.garantiaAnuencias || 'anuências não informadas'}`)}${row('Documentação', data.garantiaDocumentos || 'Não informada')}${row('Registradora / depósito', `${data.registradora || 'Pendente de definição'} · ${data.numeroRegistro || 'sem número'} · ${dateBR(data.dataRegistro)}`)}</table></section>
<section class="section"><h2>Cláusulas e condições gerais</h2>${clauses.map((clause, index) => `<article class="clause"><h3>${index + 1}. ${escapeHtml(clause.title)}</h3><p>${escapeHtml(clause.body)}</p></article>`).join('')}</section>
${c?.observacoes ? `<section class="section"><h2>Condições particulares e observações</h2><p>${escapeHtml(c.observacoes)}</p></section>` : ''}
<div class="signatures"><div class="signature"><b>EMITENTE</b><br/>${escapeHtml(c?.emitenteNome)}</div><div class="signature"><b>CREDOR</b><br/>${escapeHtml(c?.credorNome)}</div>${(data.avalistas || []).map((item) => `<div class="signature"><b>AVALISTA / GARANTIDOR</b><br/>${escapeHtml(item.nome)}</div>`).join('')}${(data.testemunhas || []).map((item) => `<div class="signature"><b>TESTEMUNHA</b><br/>${escapeHtml(item.nome)} · ${escapeHtml(item.cpfCnpj)}</div>`).join('')}</div>
<footer class="footer"><b>Nota de conferência:</b> a plataforma organiza dados, gera a minuta e registra o fluxo operacional. A validade e a eficácia do título dependem do correto preenchimento, da assinatura das partes e dos registros/depósitos exigíveis. Recomenda-se revisão jurídica e documental antes da emissão definitiva.</footer>
</main></body></html>`;
}

export function renderCprMarkdown(c: any): string {
  const html = renderCprHtml(c);
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
