import PDFDocument from 'pdfkit';
import { LOGO_ICON_BASE64 } from './logo-asset';
import {
  brl,
  cprContractData,
  dateBR,
  getCprClauses,
  getFaceValue,
  getPaymentSchedule,
  numberBR,
  percentBR,
} from '../cpr/cpr-document';

const GREEN = '#08783e';
const DARK = '#153b2a';
const GOLD = '#a97824';
const INK = '#17231c';
const MUTED = '#5e6c64';
const LINE = '#dfe8e1';
const SOFT = '#f3f8f4';

/** Gera a minuta contratual completa usada na prévia, download e assinatura. */
export function renderCprPdf(c: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 42, right: 46, bottom: 58, left: 46 },
        bufferPages: true,
        info: {
          Title: `CPR ${c?.numeroCpr || 'Rascunho'} - ConectCampo`,
          Author: 'ConectCampo',
          Subject: 'Cédula de Produto Rural',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const data = cprContractData(c);
      const clauses = getCprClauses(c);
      const schedule = getPaymentSchedule(c);
      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const width = right - left;
      // Reserva o rodapé sem desperdiçar a faixa útil da página. Os blocos
      // continuam passando integralmente para a página seguinte quando não
      // cabem, mas a nota final pode permanecer junto das assinaturas.
      const bottom = doc.page.height - doc.page.margins.bottom - 60;
      const isDraft = !c?.numeroCpr || c?.status === 'RASCUNHO';
      const isExample = Boolean(data.minutaExemplo);
      const type = c?.type === 'FISICA' ? 'CPR FÍSICA' : 'CPR FINANCEIRA';
      const faceValue = getFaceValue(c);
      const productReferenceValue = c?.precoUnitario != null && c?.quantidade != null
        ? Number(c.precoUnitario) * Number(c.quantidade)
        : null;
      const expectedEmissionCost = faceValue == null ? null : faceValue * 0.008;
      let pageNumber = 1;
      let y = 0;

      const drawHeader = () => {
        if (isExample) {
          doc.save();
          doc.fillOpacity(0.07).fillColor(GREEN).font('Helvetica-Bold').fontSize(42);
          doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
          doc.text('EXEMPLO FICTÍCIO', 80, doc.page.height / 2 - 24, { width: doc.page.width - 160, align: 'center' });
          doc.restore();
        }
        try {
          doc.image(Buffer.from(LOGO_ICON_BASE64, 'base64'), left, 34, { width: 34, height: 34 });
        } catch {
          // A marca textual mantém o documento utilizável sem o ativo gráfico.
        }
        doc.font('Helvetica-Bold').fontSize(17).fillColor(DARK).text('ConectCampo', left + 43, 35);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(GOLD).text('DOCUMENTOS DO AGRO', left + 43, 55, { characterSpacing: 1.1 });
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK).text(c?.numeroCpr || 'Nº A ATRIBUIR', left, 36, { width, align: 'right' });
        doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(`${type} · ${String(c?.status || 'RASCUNHO')}`, left, 51, { width, align: 'right' });
        doc.moveTo(left, 76).lineTo(right, 76).lineWidth(2).strokeColor(GREEN).stroke();
        if (isDraft || isExample) {
          doc.roundedRect(left, 84, width, 25, 5).fillAndStroke('#fff8e8', '#e4bd6e');
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#76520e').text(
            isExample
              ? 'EXEMPLO FICTÍCIO · SEM VALIDADE JURÍDICA'
              : 'MINUTA PARA CONFERÊNCIA · REVISE TODOS OS CAMPOS ANTES DA ASSINATURA',
            left + 8,
            92,
            { width: width - 16, align: 'center' },
          );
          y = 121;
        } else {
          y = 91;
        }
      };

      const drawFooter = (page: number) => {
        const footerY = doc.page.height - doc.page.margins.bottom - 15;
        doc.moveTo(left, footerY - 5).lineTo(right, footerY - 5).lineWidth(0.5).strokeColor(LINE).stroke();
        doc.font('Helvetica').fontSize(6.8).fillColor(MUTED).text(
          'ConectCampo · minuta eletrônica · confira dados, assinaturas e registros oficiais.',
          left,
          footerY,
          { width: width - 70 },
        );
        doc.font('Helvetica-Bold').text(`Página ${page}`, right - 60, footerY, { width: 60, align: 'right' });
      };

      const newPage = () => {
        drawFooter(pageNumber);
        doc.addPage();
        pageNumber += 1;
        drawHeader();
      };
      const ensureSpace = (height: number) => {
        if (y + height > bottom) newPage();
      };
      const title = (text: string, subtitle: string) => {
        ensureSpace(52);
        doc.font('Helvetica-Bold').fontSize(15).fillColor(DARK).text(text, left, y, { width, align: 'center' });
        y = doc.y + 3;
        doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(subtitle, left, y, { width, align: 'center' });
        y = doc.y + 13;
      };
      const sectionTitle = (text: string) => {
        ensureSpace(31);
        doc.roundedRect(left, y, width, 21, 4).fill(SOFT);
        doc.rect(left, y, 4, 21).fill(GREEN);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(GREEN).text(text.toUpperCase(), left + 10, y + 6, {
          width: width - 18,
          characterSpacing: 0.55,
        });
        y += 28;
      };
      const keyRow = (label: string, value: string) => {
        const labelWidth = 151;
        const valueWidth = width - labelWidth;
        doc.font('Helvetica').fontSize(8.2);
        const labelHeight = doc.heightOfString(label, { width: labelWidth - 12 });
        doc.font('Helvetica-Bold').fontSize(8.4);
        const valueHeight = doc.heightOfString(value || 'Não informado', { width: valueWidth - 12 });
        const rowHeight = Math.max(25, Math.max(labelHeight, valueHeight) + 11);
        ensureSpace(rowHeight);
        doc.rect(left, y, labelWidth, rowHeight).fillAndStroke('#f9fbf9', LINE);
        doc.rect(left + labelWidth, y, valueWidth, rowHeight).fillAndStroke('#ffffff', LINE);
        doc.font('Helvetica').fontSize(8.2).fillColor(MUTED).text(label, left + 6, y + 6, { width: labelWidth - 12 });
        doc.font('Helvetica-Bold').fontSize(8.4).fillColor(INK).text(value || 'Não informado', left + labelWidth + 6, y + 6, { width: valueWidth - 12 });
        y += rowHeight;
      };
      const paragraph = (heading: string, body: string) => {
        doc.font('Helvetica-Bold').fontSize(8.35);
        const headingHeight = doc.heightOfString(heading, { width });
        doc.font('Helvetica').fontSize(8.35);
        const bodyHeight = doc.heightOfString(body, { width, align: 'justify', lineGap: 1.2 });
        ensureSpace(headingHeight + bodyHeight + 10);
        doc.font('Helvetica-Bold').fillColor(INK).text(heading, left, y, { width });
        y = doc.y + 2;
        doc.font('Helvetica').fillColor(INK).text(body, left, y, { width, align: 'justify', lineGap: 1.2 });
        y = doc.y + 8;
      };
      const scheduleTable = () => {
        const widths = [45, 86, 116, 104, width - 351];
        const row = (values: string[], header = false) => {
          ensureSpace(23);
          let x = left;
          values.forEach((value, index) => {
            doc.rect(x, y, widths[index], 23).fillAndStroke(header ? SOFT : '#ffffff', LINE);
            doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(header ? GREEN : INK).text(
              value,
              x + 4,
              y + 7,
              { width: widths[index] - 8, align: index === 0 ? 'center' : index > 1 ? 'right' : 'left' },
            );
            x += widths[index];
          });
          y += 23;
        };
        row(['Parcela', 'Vencimento', 'Principal', 'Encargos', 'Total'], true);
        schedule.forEach((item) => row([
          String(item.numero ?? '—'), dateBR(item.vencimento), brl(item.principal), brl(item.encargos), brl(item.total),
        ]));
      };

      drawHeader();
      title(
        `CÉDULA DE PRODUTO RURAL — ${c?.type === 'FISICA' ? 'FÍSICA' : 'COM LIQUIDAÇÃO FINANCEIRA'}`,
        'Lei nº 8.929/1994 e alterações posteriores · título com cláusula à ordem',
      );
      sectionTitle('Quadro-resumo do título');
      keyRow('Número da CPR', String(c?.numeroCpr || 'A atribuir na emissão'));
      keyRow('Local e data de emissão', `${data.localEmissao || [c?.emitenteCidade, c?.emitenteEstado].filter(Boolean).join('/') || 'Não informado'} · ${dateBR(data.dataEmissao || c?.createdAt)}`);
      keyRow('Valor de face', brl(getFaceValue(c)));
      keyRow('Vencimento final', dateBR(c?.dataVencimento));
      keyRow('Finalidade declarada', c?.finalidade || (c?.purpose === 'CAPTACAO' ? 'Captação de crédito' : 'Emissão de CPR'));

      y += 10;
      sectionTitle('Emitente, credor e garantidores');
      keyRow('EMITENTE', `${c?.emitenteNome || 'Não informado'} · ${c?.emitenteCpfCnpj || 'documento não informado'}`);
      keyRow('Qualificação / endereço', `${data.emitenteQualificacao || 'Qualificação não informada'} · ${c?.emitenteEndereco || 'endereço não informado'} · ${c?.emitenteCidade || ''}/${c?.emitenteEstado || ''} · CEP ${data.emitenteCep || 'não informado'}`);
      keyRow('Representante / contato', `${data.emitenteRepresentante || 'Não informado'} · ${c?.emitenteEmail || 'e-mail não informado'} · ${c?.emitenteTelefone || 'telefone não informado'}`);
      keyRow('Conta para liberação', [data.emitenteBanco, data.emitenteAgencia, data.emitenteConta].filter(Boolean).join(' · ') || 'Não informada');
      keyRow('CREDOR', `${c?.credorNome || 'Não informado'} · ${c?.credorCpfCnpj || 'documento não informado'}`);
      keyRow('Qualificação / endereço', `${data.credorQualificacao || c?.credorTipo || 'Qualificação não informada'} · ${data.credorEndereco || 'endereço não informado'} · ${data.credorCidade || ''}/${data.credorEstado || ''} · CEP ${data.credorCep || 'não informado'}`);
      keyRow('Representante / contato', `${data.credorRepresentante || 'Não informado'} · ${c?.credorEmail || 'e-mail não informado'} · ${c?.credorTelefone || 'telefone não informado'}`);
      if (data.avalistas?.length) {
        data.avalistas.forEach((item, index) => keyRow(
          `AVALISTA / GARANTIDOR ${index + 1}`,
          `${item.nome || 'Não informado'} · ${item.cpfCnpj || 'documento não informado'} · ${item.qualificacao || 'qualificação não informada'} · ${item.endereco || 'endereço não informado'}`,
        ));
      } else {
        keyRow('Avalistas / garantidores', 'Não há avalistas cadastrados nesta minuta.');
      }

      y += 10;
      sectionTitle('Produto rural, produção e entrega');
      keyRow('Produto / quantidade', `${c?.produto || 'Não informado'} · ${numberBR(c?.quantidade, 4)} ${c?.unidade || ''}`);
      keyRow('Safra / qualidade / padrão', `${c?.safraAno || 'Não informado'} · ${data.produtoQualidade || 'qualidade a definir'} · ${data.produtoPadrao || 'padrão a definir'}`);
      keyRow('Origem da produção', `${data.propriedadeNome || 'Propriedade não informada'} · ${data.propriedadeEndereco || 'local não informado'} · matrícula ${data.propriedadeMatricula || 'não informada'} · CAR ${c?.emitenteCarNumero || 'não informado'}`);
      keyRow('Armazenamento', `${data.armazenamentoNome || 'Não informado'} · ${data.armazenamentoEndereco || 'endereço não informado'}`);
      keyRow('Entrega', `${c?.localEntrega || 'Não informado'} · ${dateBR(c?.dataEntrega)}`);
      keyRow('Preço e referência', `${brl(c?.precoUnitario)} · ${[data.indicePreco, data.fontePreco, data.mercadoReferencia].filter(Boolean).join(' · ') || 'índice/fonte não informados'} · substituição: ${data.criterioSubstituicaoIndice || 'a definir'}`);

      y += 10;
      sectionTitle('Condições financeiras');
      keyRow('Valor de face', brl(getFaceValue(c)));
      keyRow('Crédito bruto / IOF / líquido', `${brl(data.valorCredito ?? c?.valorCaptacao)} · ${brl(data.valorIof)} · ${brl(data.valorLiquido)}`);
      keyRow('Valor de resgate previsto', brl(data.valorResgate ?? getFaceValue(c)));
      keyRow('Taxas remuneratórias', `${percentBR(data.taxaJurosMensal, 'a.m.')} · ${percentBR(data.taxaJurosAnual, 'a.a.')}`);
      keyRow('Custo efetivo total', `${percentBR(data.cetMensal, 'a.m.')} · ${percentBR(data.cetAnual, 'a.a.')}`);
      keyRow('Capitalização / amortização', `${data.capitalizacao || 'Não informada'} · ${data.sistemaAmortizacao || 'sistema não informado'} · base ${data.baseCalculoDias || 'não informada'} dias`);
      keyRow('Periodicidade', data.periodicidadePagamento || 'Conforme cronograma');
      keyRow('Mora e demais encargos', `Multa ${percentBR(data.multaMoraPct, '')} · juros ${percentBR(data.jurosMoraMensalPct, 'a.m.')} · ${data.encargosAdicionais || 'demais encargos não informados'}`);
      keyRow('Custo de emissão ConectCampo', c?.type === 'FINANCEIRA'
        ? `${brl(c?.custoEmissao)} · 0,8% do valor de face`
        : `${brl(c?.custoEmissao)} · pagamento único`);
      keyRow('Liquidação / local', `${data.formaLiquidacao || (c?.type === 'FISICA' ? 'Entrega física' : 'Liquidação financeira')} · ${data.localPagamento || c?.localEntrega || 'local não informado'}`);
      keyRow('Liberação / condições', `${data.beneficiarioLiberacao || c?.emitenteNome || 'beneficiário não informado'} · ${data.condicoesPrecedentes || 'condições precedentes não informadas'}`);

      y += 10;
      sectionTitle('Conferência automática dos valores');
      keyRow('Produto x preço', productReferenceValue == null ? 'Não conciliado: informe quantidade e preço' : `${numberBR(c?.quantidade, 4)} ${c?.unidade || ''} x ${brl(c?.precoUnitario)} = ${brl(productReferenceValue)}`);
      keyRow('Valor de face', faceValue == null ? 'Não informado' : brl(faceValue));
      keyRow('Conciliação', productReferenceValue == null || faceValue == null
        ? 'Pendente de dados'
        : Math.abs(productReferenceValue - faceValue) < 0.01
          ? 'Valores conciliados'
          : `Divergência de ${brl(faceValue - productReferenceValue)} - revisar antes da emissão`);
      keyRow('Custo de emissão', c?.type === 'FINANCEIRA'
        ? `${brl(c?.custoEmissao)} · esperado a 0,8%: ${brl(expectedEmissionCost)}`
        : `${brl(c?.custoEmissao)} · pagamento único`);

      y += 10;
      sectionTitle('Cronograma de liquidação');
      scheduleTable();
      y += 10;
      sectionTitle('Garantias e registro');
      keyRow('Garantia', `${c?.garantiaTipo || 'Não informada'} · ${c?.garantiaDescricao || 'descrição não informada'} · ${brl(c?.garantiaValor)}`);
      keyRow('Proprietário / registro / grau', `${data.garantiaProprietario || 'Não informado'} · ${data.garantiaRegistro || 'registro não informado'} · ${data.garantiaGrau || 'grau não informado'}`);
      keyRow('Cartório / área', `${data.garantiaCartorio || 'Não informado'} · ${data.garantiaAreaHectares != null ? `${numberBR(data.garantiaAreaHectares, 4)} ha` : 'área não informada'}`);
      keyRow('Ônus / anuências', `${data.garantiaOnus || 'Não informados'} · ${data.garantiaAnuencias || 'anuências não informadas'}`);
      keyRow('Documentação', data.garantiaDocumentos || 'Matrículas, certidões, cadastros e laudos a confirmar');
      keyRow('Registradora / depósito', `${data.registradora || 'Pendente de definição'} · ${data.numeroRegistro || 'sem número'} · ${dateBR(data.dataRegistro)}`);

      y += 12;
      sectionTitle('Cláusulas e condições gerais');
      clauses.forEach((clause, index) => {
        paragraph(`${index + 1}. ${clause.title}`, clause.body);
      });

      if (c?.observacoes) {
        y += 5;
        sectionTitle('Condições particulares e observações');
        paragraph('Observações', String(c.observacoes));
      }

      ensureSpace(165);
      y += 14;
      sectionTitle('Declaração final e assinaturas');
      paragraph('Declaração', `As partes declaram ter lido e conferido esta CPR, especialmente o valor de face, o produto, o cronograma, as garantias, os encargos e os dados de registro. Firmam o título em ${data.localEmissao || [c?.emitenteCidade, c?.emitenteEstado].filter(Boolean).join('/') || 'local a definir'}, na data de ${dateBR(data.dataEmissao || c?.createdAt)}.`);

      const signatureWidth = (width - 30) / 2;
      const signature = (label: string, name: string, x: number) => {
        doc.moveTo(x, y + 32).lineTo(x + signatureWidth, y + 32).lineWidth(0.7).strokeColor(INK).stroke();
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(INK).text(label, x, y + 38, { width: signatureWidth, align: 'center' });
        doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(name || 'Não informado', x, y + 50, { width: signatureWidth, align: 'center' });
      };
      const signatureEntries = [
        { label: 'EMITENTE', name: c?.emitenteNome || 'Não informado' },
        { label: 'CREDOR', name: c?.credorNome || 'Não informado' },
        ...(data.avalistas || []).map((item, index) => ({
          label: `AVALISTA / GARANTIDOR ${index + 1}`,
          name: item.nome || 'Não informado',
        })),
        ...(data.testemunhas || []).map((item, index) => ({
          label: `TESTEMUNHA ${index + 1}`,
          name: `${item.nome || 'Não informado'} · ${item.cpfCnpj || 'CPF não informado'}`,
        })),
      ];
      for (let index = 0; index < signatureEntries.length; index += 2) {
        ensureSpace(82);
        const first = signatureEntries[index];
        const second = signatureEntries[index + 1];
        signature(first.label, first.name, left);
        if (second) signature(second.label, second.name, left + signatureWidth + 30);
        y += 82;
      }

      ensureSpace(62);
      doc.roundedRect(left, y, width, 48, 5).fillAndStroke('#f8faf8', LINE);
      doc.font('Helvetica-Bold').fontSize(7.2).fillColor(DARK).text('NOTA DE CONFERÊNCIA', left + 9, y + 8);
      doc.font('Helvetica').fontSize(7.1).fillColor(MUTED).text(
        'A ConectCampo organiza os dados, gera a minuta e registra o fluxo operacional. A validade e a eficácia do título dependem do correto preenchimento, da assinatura das partes e dos registros ou depósitos exigíveis. Recomenda-se revisão jurídica e documental antes da emissão definitiva.',
        left + 9,
        y + 19,
        { width: width - 18, lineGap: 0.8 },
      );
      drawFooter(pageNumber);

      doc.end();
    } catch (error) {
      reject(error as Error);
    }
  });
}
