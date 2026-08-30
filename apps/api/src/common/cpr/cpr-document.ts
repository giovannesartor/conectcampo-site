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
  indicePreco?: string;
  fontePreco?: string;
  mercadoReferencia?: string;
  taxaJurosMensal?: number;
  taxaJurosAnual?: number;
  cetMensal?: number;
  cetAnual?: number;
  multaMoraPct?: number;
  jurosMoraMensalPct?: number;
  encargosAdicionais?: string;
  valorCredito?: number;
  valorIof?: number;
  valorLiquido?: number;
  formaLiquidacao?: string;
  localPagamento?: string;
  cronograma?: CprInstallment[];
  garantiaProprietario?: string;
  garantiaRegistro?: string;
  garantiaGrau?: string;
  registradora?: string;
  numeroRegistro?: string;
  dataRegistro?: string;
  foroCidade?: string;
  foroEstado?: string;
  contatoNotificacoes?: string;
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

  return [
    {
      title: 'Natureza, emissão e cláusula à ordem',
      body: `Esta Cédula de Produto Rural (“CPR”), emitida em ${place(c)}, constitui promessa pura e simples do EMITENTE em favor do CREDOR, com cláusula à ordem, regendo-se pela Lei nº 8.929/1994, suas alterações e pelas condições desta cédula. A numeração definitiva será atribuída no momento da emissão pela plataforma.`,
    },
    {
      title: isFinancial ? 'Objeto e liquidação financeira' : 'Objeto e entrega física',
      body: isFinancial
        ? `O EMITENTE promete pagar ao CREDOR, no vencimento e conforme o cronograma, o valor resultante da liquidação financeira do produto de referência: ${product}. O valor de face é ${faceValue}, observados os critérios de apuração e atualização aqui indicados.`
        : `O EMITENTE promete entregar ao CREDOR o seguinte produto rural: ${product}, na qualidade e no padrão contratados, no local ${delivery}, nas datas e condições previstas nesta cédula.`,
    },
    {
      title: 'Identificação, qualidade e origem do produto',
      body: `O produto vinculado corresponde à safra ${c?.safraAno || 'não informada'}, com qualidade ${data.produtoQualidade || 'a definir'} e padrão/classificação ${data.produtoPadrao || 'a definir'}. A produção está vinculada à propriedade ${data.propriedadeNome || 'não informada'}, matrícula ${data.propriedadeMatricula || 'não informada'} e CAR ${c?.emitenteCarNumero || 'não informado'}.`,
    },
    {
      title: 'Valor de face, preço e critérios de apuração',
      body: `O valor de face da CPR é ${faceValue}. Quando houver apuração por preço ou índice, serão usados ${priceReference}, conforme dados verificáveis na data de cálculo. Qualquer substituição da fonte deverá preservar equivalência econômica e ser documentada entre as partes.`,
    },
    {
      title: 'Liberação e destinação dos recursos',
      body: `O crédito bruto é ${brl(data.valorCredito ?? c?.valorCaptacao ?? getFaceValue(c))}, o IOF informado é ${brl(data.valorIof)}, e o valor líquido estimado é ${brl(data.valorLiquido)}. A destinação declarada é ${c?.finalidade || 'não informada'}. Valores não informados não serão presumidos como zero e deverão ser confirmados antes da assinatura.`,
    },
    {
      title: 'Encargos, custo efetivo e tarifa da plataforma',
      body: `Taxa mensal: ${percentBR(data.taxaJurosMensal, 'a.m.')}; taxa anual: ${percentBR(data.taxaJurosAnual, 'a.a.')}; CET mensal: ${percentBR(data.cetMensal, 'a.m.')}; CET anual: ${percentBR(data.cetAnual, 'a.a.')}. ${isFinancial ? `O custo de emissão ConectCampo da CPR Financeira corresponde a 0,8% do valor de face, totalizando ${brl(c?.custoEmissao)}` : `O custo fixo de emissão ConectCampo da CPR Física totaliza ${brl(c?.custoEmissao)}`}, e não substitui tributos, emolumentos, custos de registro ou encargos do crédito eventualmente pactuados com o CREDOR.`,
    },
    {
      title: 'Forma, local e cronograma de pagamento',
      body: `A liquidação ocorrerá por ${data.formaLiquidacao || (isFinancial ? 'transferência bancária ou outro meio acordado' : 'entrega física do produto')}, no local ${data.localPagamento || delivery}, até ${maturity}, observadas as parcelas constantes do quadro de cronograma. Pagamentos serão considerados quitados somente após disponibilidade definitiva ao CREDOR.`,
    },
    {
      title: 'Garantias',
      body: `A garantia principal cadastrada é ${c?.garantiaTipo || 'sem garantia adicional informada'}, descrita como ${c?.garantiaDescricao || 'não informada'}, no valor declarado de ${brl(c?.garantiaValor)}. Proprietário/garantidor: ${data.garantiaProprietario || 'não informado'}; registro: ${data.garantiaRegistro || 'não informado'}; grau: ${data.garantiaGrau || 'não informado'}. Avalistas: ${guarantorLabel(c)} As garantias deverão ser formalizadas e registradas quando exigido pela sua natureza.`,
    },
    {
      title: 'Conservação, fiscalização e substituição de garantias',
      body: 'O EMITENTE conservará o produto e os bens dados em garantia, permitirá inspeções razoáveis mediante aviso prévio e comunicará imediatamente fatos que reduzam sua quantidade, qualidade ou valor. Havendo deterioração relevante, as partes poderão pactuar reforço ou substituição equivalente da garantia.',
    },
    {
      title: 'Mora e inadimplemento',
      body: `O não cumprimento de obrigação no vencimento constitui o EMITENTE em mora independentemente de aviso. Quando expressamente contratados, incidirão multa de ${percentBR(data.multaMoraPct, '')}, juros de mora de ${percentBR(data.jurosMoraMensalPct, 'a.m.')} e os seguintes encargos adicionais: ${data.encargosAdicionais || 'não informados'}. Poderão ainda ser exigidas despesas de cobrança comprovadas e as demais consequências previstas em lei. Nenhum encargo não preenchido será presumido.`,
    },
    {
      title: 'Vencimento antecipado',
      body: 'O CREDOR poderá declarar antecipadamente vencidas as obrigações em caso de falsidade de declaração relevante, desvio da finalidade declarada, alienação ou oneração indevida de garantia, insolvência, recuperação judicial ou extrajudicial, dissolução, perda relevante do produto/garantia sem recomposição ou descumprimento não sanado de obrigação essencial, assegurada comunicação ao EMITENTE quando cabível.',
    },
    {
      title: 'Liquidação antecipada',
      body: 'A liquidação antecipada dependerá de solicitação e de demonstrativo do saldo na data pretendida. Eventual custo de ruptura, desconto ou restituição deverá observar o contrato, a legislação aplicável e memória de cálculo transparente, vedada a inclusão de valor não previamente previsto ou demonstrado.',
    },
    {
      title: 'Compensação e imputação',
      body: 'Quando permitido pela legislação e pela natureza das partes, créditos líquidos, certos e exigíveis poderão ser compensados mediante demonstrativo. Pagamentos parciais serão imputados segundo a ordem legal ou a ordem expressamente acordada, sem novação do saldo remanescente.',
    },
    {
      title: 'Circulação, endosso e cessão',
      body: 'A CPR poderá circular por endosso ou cessão na forma da lei. O sucessor deverá respeitar a cadeia de titularidade, as garantias e o registro aplicável, sem alteração dos dados essenciais do título fora dos mecanismos legalmente admitidos.',
    },
    {
      title: 'Registro, depósito e custódia',
      body: `A CPR deverá ser registrada ou depositada no prazo legal perante ${registry}, quando exigível. Garantias reais e demais atos acessórios serão levados aos registros competentes conforme sua natureza. O status exibido pela ConectCampo é operacional e não substitui comprovante oficial da registradora ou do cartório.`,
    },
    {
      title: 'Declarações do emitente e garantidores',
      body: 'O EMITENTE e os garantidores declaram, sob sua responsabilidade, capacidade e poderes para contratar; veracidade dos dados e documentos; origem lícita dos recursos e do produto; inexistência de ônus omitidos; e ciência de que informações incompletas devem ser corrigidas antes da assinatura.',
    },
    {
      title: 'Obrigações socioambientais e trabalhistas',
      body: 'As partes comprometem-se a observar a legislação ambiental, agrária, trabalhista e de saúde e segurança, incluindo a vedação de trabalho infantil, análogo ao escravo e de práticas discriminatórias. Ocorrências materiais relacionadas à produção ou às garantias deverão ser informadas sem demora indevida.',
    },
    {
      title: 'Anticorrupção, prevenção a ilícitos e sanções',
      body: 'As partes declaram observar normas anticorrupção, de prevenção à lavagem de dinheiro, ao financiamento do terrorismo e sanções aplicáveis, mantendo registros suficientes para demonstrar a origem e a destinação lícitas da operação.',
    },
    {
      title: 'Dados pessoais, cadastros e SCR',
      body: 'Os dados pessoais serão tratados para formação, execução, assinatura, registro, prevenção a fraudes e defesa de direitos, nos termos da legislação aplicável. Consultas ou comunicações ao SCR e a cadastros de crédito somente poderão ocorrer por parte legitimada, com base legal e dever de informação próprios; a ConectCampo não realiza tais registros automaticamente por esta minuta.',
    },
    {
      title: 'Comunicações e assinatura eletrônica',
      body: `Comunicações serão enviadas aos contatos cadastrados, especialmente ${data.contatoNotificacoes || [c?.emitenteEmail, c?.credorEmail].filter(Boolean).join(' e ') || 'contatos a confirmar'}. As partes reconhecem a assinatura eletrônica e a trilha de auditoria adotadas, sem prejuízo de requisitos adicionais da registradora, do credor ou da legislação aplicável.`,
    },
    {
      title: 'Alterações, tolerância e nulidade parcial',
      body: 'Alterações materiais deverão ser formalizadas por aditivo ou mecanismo eletrônico auditável. A tolerância não implica renúncia, novação ou alteração. A eventual invalidade de uma disposição não prejudicará as demais, que permanecerão eficazes na máxima extensão permitida.',
    },
    {
      title: 'Solução de controvérsias e foro',
      body: `As partes buscarão solução negocial de boa-fé. Não havendo acordo, fica eleito o foro de ${data.foroCidade || c?.emitenteCidade || 'cidade a definir'}/${data.foroEstado || c?.emitenteEstado || 'UF'}, ressalvadas competências legais inderrogáveis e eventual convenção válida de arbitragem preenchida em instrumento próprio.`,
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
  const row = (label: string, value: unknown) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>CPR ${escapeHtml(c?.numeroCpr || 'Rascunho')}</title><style>
@page{size:A4;margin:16mm 15mm 18mm}*{box-sizing:border-box}body{margin:0;color:#142019;font:11px/1.5 Arial,sans-serif;background:#fff}.toolbar{position:sticky;top:0;z-index:2;display:flex;justify-content:center;gap:8px;padding:10px;background:#edf5ef;border-bottom:1px solid #dce9df}.toolbar button{border:0;border-radius:8px;background:#08783e;color:#fff;padding:9px 16px;font-weight:700;cursor:pointer}.page{max-width:820px;margin:0 auto;padding:18px 26px}.header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #08783e;padding-bottom:12px}.brand{font-size:22px;font-weight:800;color:#064c31}.brand small{display:block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#b07c25}.meta{text-align:right;color:#53635a}.meta b{display:block;color:#17251d}.notice{margin:14px 0;border:1px solid #e6bf73;border-radius:8px;background:#fff9eb;color:#785410;padding:9px 11px;font-weight:700}.title{text-align:center;margin:18px 0 14px}.title h1{margin:0;color:#173d2b;font-size:17px}.title p{margin:4px 0;color:#68766e}.section{margin:15px 0;break-inside:avoid}.section h2{margin:0 0 7px;padding:6px 9px;border-left:4px solid #08783e;background:#edf7f0;color:#075b35;font-size:10px;letter-spacing:.09em;text-transform:uppercase}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe8e1;padding:5px 7px;text-align:left;vertical-align:top}th{width:31%;background:#f7faf8;color:#526158;font-weight:600}td{color:#142019;font-weight:600}.schedule th{width:auto}.clause{break-inside:avoid;margin:0 0 10px}.clause h3{margin:0 0 2px;color:#173d2b;font-size:10.5px}.clause p{margin:0;text-align:justify}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:45px}.signature{border-top:1px solid #24342b;text-align:center;padding-top:6px}.footer{margin-top:24px;padding-top:9px;border-top:1px solid #dfe8e1;color:#65746b;font-size:8.5px}@media print{.toolbar{display:none}.page{padding:0}.clause,.section{break-inside:avoid}}
</style></head><body><div class="toolbar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div><main class="page">
<header class="header"><div class="brand">ConectCampo<small>Documentos do agro</small></div><div class="meta"><b>${escapeHtml(c?.numeroCpr || 'Nº a atribuir')}</b>${escapeHtml(type)}<br/>Status: ${escapeHtml(c?.status || 'RASCUNHO')}</div></header>
${draft || data.minutaExemplo ? `<div class="notice">${data.minutaExemplo ? 'EXEMPLO FICTÍCIO — SEM VALIDADE JURÍDICA' : 'MINUTA PARA CONFERÊNCIA — REVISE TODOS OS CAMPOS ANTES DA ASSINATURA'}</div>` : ''}
<div class="title"><h1>CÉDULA DE PRODUTO RURAL — ${c?.type === 'FISICA' ? 'FÍSICA' : 'COM LIQUIDAÇÃO FINANCEIRA'}</h1><p>Lei nº 8.929/1994 e alterações posteriores · cláusula à ordem</p></div>
<section class="section"><h2>Identificação do título</h2><table>${row('Número', c?.numeroCpr || 'A atribuir')}${row('Local e data de emissão', `${data.localEmissao || [c?.emitenteCidade, c?.emitenteEstado].filter(Boolean).join('/') || 'Não informado'} · ${dateBR(data.dataEmissao || c?.createdAt)}`)}${row('Valor de face', brl(getFaceValue(c)))}${row('Vencimento final', dateBR(c?.dataVencimento))}${row('Finalidade declarada', c?.finalidade || (c?.purpose === 'CAPTACAO' ? 'Captação de crédito' : 'Emissão de CPR'))}</table></section>
<section class="section"><h2>Partes</h2><table>${row('Emitente', `${c?.emitenteNome || 'Não informado'} · ${c?.emitenteCpfCnpj || 'documento não informado'}`)}${row('Qualificação e endereço do emitente', `${data.emitenteQualificacao || 'Não informado'} · ${c?.emitenteEndereco || 'endereço não informado'} · ${c?.emitenteCidade || ''}/${c?.emitenteEstado || ''} · CEP ${data.emitenteCep || 'não informado'}`)}${row('Conta para liberação', [data.emitenteBanco, data.emitenteAgencia, data.emitenteConta].filter(Boolean).join(' · ') || 'Não informada')}${row('Credor', `${c?.credorNome || 'Não informado'} · ${c?.credorCpfCnpj || 'documento não informado'}`)}${row('Qualificação e endereço do credor', `${data.credorQualificacao || c?.credorTipo || 'Não informado'} · ${data.credorEndereco || 'endereço não informado'} · ${data.credorCidade || ''}/${data.credorEstado || ''} · CEP ${data.credorCep || 'não informado'}`)}${row('Avalistas / garantidores', guarantorLabel(c))}</table></section>
<section class="section"><h2>Produto, produção e entrega</h2><table>${row('Produto e quantidade', `${c?.produto || 'Não informado'} · ${numberBR(c?.quantidade, 4)} ${c?.unidade || ''}`)}${row('Safra, qualidade e padrão', `${c?.safraAno || 'Não informado'} · ${data.produtoQualidade || 'qualidade a definir'} · ${data.produtoPadrao || 'padrão a definir'}`)}${row('Produção', `${data.propriedadeNome || 'Não informado'} · ${data.propriedadeEndereco || 'local não informado'} · matrícula ${data.propriedadeMatricula || 'não informada'} · CAR ${c?.emitenteCarNumero || 'não informado'}`)}${row('Entrega', `${c?.localEntrega || 'Não informado'} · ${dateBR(c?.dataEntrega)}`)}${row('Preço / índice de referência', [brl(c?.precoUnitario), data.indicePreco, data.fontePreco, data.mercadoReferencia].filter(Boolean).join(' · '))}</table></section>
<section class="section"><h2>Condições financeiras e custo de emissão</h2><table>${row('Valor de face', brl(getFaceValue(c)))}${row('Crédito bruto / IOF / líquido', `${brl(data.valorCredito ?? c?.valorCaptacao)} · ${brl(data.valorIof)} · ${brl(data.valorLiquido)}`)}${row('Taxas', `${percentBR(data.taxaJurosMensal, 'a.m.')} · ${percentBR(data.taxaJurosAnual, 'a.a.')}`)}${row('CET', `${percentBR(data.cetMensal, 'a.m.')} · ${percentBR(data.cetAnual, 'a.a.')}`)}${row('Mora', `Multa ${percentBR(data.multaMoraPct, '')} · juros ${percentBR(data.jurosMoraMensalPct, 'a.m.')} · ${data.encargosAdicionais || 'demais encargos não informados'}`)}${row('Custo ConectCampo', c?.type === 'FINANCEIRA' ? `${brl(c?.custoEmissao)} · 0,8% do valor de face` : `${brl(c?.custoEmissao)} · valor fixo`)}</table></section>
<section class="section"><h2>Cronograma de liquidação</h2><table class="schedule"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Principal</th><th>Encargos</th><th>Total</th></tr></thead><tbody>${schedule.map((item) => `<tr><td>${escapeHtml(item.numero)}</td><td>${escapeHtml(dateBR(item.vencimento))}</td><td>${escapeHtml(brl(item.principal))}</td><td>${escapeHtml(brl(item.encargos))}</td><td>${escapeHtml(brl(item.total))}</td></tr>`).join('')}</tbody></table></section>
<section class="section"><h2>Garantias e registro</h2><table>${row('Garantia', `${c?.garantiaTipo || 'Não informada'} · ${c?.garantiaDescricao || 'descrição não informada'} · ${brl(c?.garantiaValor)}`)}${row('Proprietário, registro e grau', `${data.garantiaProprietario || 'Não informado'} · ${data.garantiaRegistro || 'registro não informado'} · ${data.garantiaGrau || 'grau não informado'}`)}${row('Registradora / depósito', `${data.registradora || 'Pendente de definição'} · ${data.numeroRegistro || 'sem número'} · ${dateBR(data.dataRegistro)}`)}</table></section>
<section class="section"><h2>Cláusulas e condições gerais</h2>${clauses.map((clause, index) => `<article class="clause"><h3>${index + 1}. ${escapeHtml(clause.title)}</h3><p>${escapeHtml(clause.body)}</p></article>`).join('')}</section>
${c?.observacoes ? `<section class="section"><h2>Condições particulares e observações</h2><p>${escapeHtml(c.observacoes)}</p></section>` : ''}
<div class="signatures"><div class="signature"><b>EMITENTE</b><br/>${escapeHtml(c?.emitenteNome)}</div><div class="signature"><b>CREDOR</b><br/>${escapeHtml(c?.credorNome)}</div>${(data.avalistas || []).map((item) => `<div class="signature"><b>AVALISTA / GARANTIDOR</b><br/>${escapeHtml(item.nome)}</div>`).join('')}</div>
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
