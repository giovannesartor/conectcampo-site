import PDFDocument from 'pdfkit';
import { LOGO_ICON_BASE64 } from './logo-asset';

const GREEN = '#008c3c';
const DARK = '#003c28';
const GOLD = '#b48c3c';
const INK = '#0a0f0c';
const MUTED = '#5b6b5e';
const LINE = '#e6ece7';

function brl(v: unknown) {
  return v == null || v === ''
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function dateBR(v: unknown) {
  return v ? new Date(v as string).toLocaleDateString('pt-BR') : '—';
}
function mesesFmt(m: number | null | undefined) {
  if (m == null) return '—';
  const anos = Math.floor(m / 12);
  const r = m % 12;
  const parts: string[] = [];
  if (anos > 0) parts.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (r > 0) parts.push(`${r} ${r === 1 ? 'mês' : 'meses'}`);
  return parts.length ? parts.join(' e ') : `${m} meses`;
}

/**
 * Gera o PDF profissional da CPR (com logo e identidade ConectCampo).
 */
export function renderCprPdf(c: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks: Buffer[] = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const width = right - left;

      // ── Cabeçalho ──
      try {
        const logo = Buffer.from(LOGO_ICON_BASE64, 'base64');
        doc.image(logo, left, 44, { width: 42, height: 42 });
      } catch {
        /* logo opcional */
      }
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor(DARK)
        .text('ConectCampo', left + 52, 46);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(GREEN)
        .text('CÉDULA DE PRODUTO RURAL', left + 52, 70);

      // Metadados (direita)
      const tipo = c.type === 'FISICA' ? 'CPR Física' : 'CPR Financeira';
      const purpose = c.purpose === 'EMISSAO' ? 'Emissão de CPR' : 'Captação de Crédito';
      doc.font('Helvetica').fontSize(9).fillColor(MUTED);
      doc.text(`Nº ${c.numeroCpr ?? '—'}`, left, 46, { width, align: 'right' });
      doc.text(`${tipo} · ${purpose}`, left, 59, { width, align: 'right' });
      doc.text(`Status: ${c.status ?? '—'}`, left, 72, { width, align: 'right' });

      // Régua
      doc.moveTo(left, 96).lineTo(right, 96).lineWidth(2).strokeColor(GREEN).stroke();

      let y = 112;

      // Título
      doc.font('Helvetica-Bold').fontSize(14).fillColor(INK).text(`${tipo} — ${purpose}`, left, y);
      y += 22;
      const safras = c.safraAno ? String(c.safraAno) : null;
      doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(
        `Produto: ${c.produto} — ${Number(c.quantidade).toLocaleString('pt-BR')} ${c.unidade}` +
          (safras ? `   ·   Safra(s): ${safras}` : ''),
        left,
        y,
      );
      y += 22;

      // Helpers de seção
      const sectionTitle = (t: string) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(GREEN).text(t.toUpperCase(), left, y);
        y += 13;
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.6).strokeColor(LINE).stroke();
        y += 7;
      };
      const rowItem = (label: string, value: string) => {
        doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, left, y, { width: 150 });
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(INK)
          .text(value || '—', left + 155, y, { width: width - 155 });
        y += 16;
      };

      // Emitente
      sectionTitle('Emitente (Produtor Rural)');
      rowItem('Nome', String(c.emitenteNome ?? '—'));
      rowItem('CPF / CNPJ', String(c.emitenteCpfCnpj ?? '—'));
      rowItem(
        'Cidade / UF',
        `${c.emitenteCidade ?? '—'}${c.emitenteEstado ? ' / ' + c.emitenteEstado : ''}`,
      );
      if (c.emitenteEmail) rowItem('E-mail', String(c.emitenteEmail));
      if (c.emitenteTelefone) rowItem('Telefone', String(c.emitenteTelefone));
      if (c.emitenteCarNumero) rowItem('CAR', String(c.emitenteCarNumero));
      y += 6;

      // Credor
      sectionTitle('Credor');
      rowItem('Nome', String(c.credorNome ?? '—'));
      rowItem('CPF / CNPJ', String(c.credorCpfCnpj ?? '—'));
      if (c.credorEmail) rowItem('E-mail', String(c.credorEmail));
      if (c.credorTelefone) rowItem('Telefone', String(c.credorTelefone));
      y += 6;

      // Produto
      sectionTitle('Produto e Entrega');
      rowItem('Produto', String(c.produto ?? '—'));
      rowItem('Quantidade', `${Number(c.quantidade).toLocaleString('pt-BR')} ${c.unidade}`);
      if (safras) rowItem('Safra(s)', safras);
      rowItem('Preço unitário', brl(c.precoUnitario));
      if (c.localEntrega) rowItem('Local de entrega', String(c.localEntrega));
      if (c.dataEntrega) rowItem('Data de entrega', dateBR(c.dataEntrega));
      y += 6;

      // Prazo
      sectionTitle('Prazo, Carência e Vencimento');
      rowItem('Prazo total', mesesFmt(c.prazoMeses));
      rowItem('Carência', mesesFmt(c.carenciaMeses));
      rowItem('Vencimento', dateBR(c.dataVencimento));
      y += 6;

      // Captação
      if (c.purpose === 'CAPTACAO') {
        sectionTitle('Captação de Crédito');
        if (c.finalidade) rowItem('Finalidade', String(c.finalidade));
        rowItem('Valor a captar', brl(c.valorCaptacao));
        if (c.garantiaTipo) rowItem('Garantia adicional', String(c.garantiaTipo));
        if (c.garantiaValor) rowItem('Valor da garantia', brl(c.garantiaValor));
        y += 6;
      }

      // Valores
      sectionTitle('Valores');
      rowItem('Valor total da CPR', brl(c.valorTotal));
      if (c.purpose === 'EMISSAO' && c.type === 'FISICA') {
        rowItem('Custo de emissão (CPR Física)', `${brl(c.custoEmissao ?? 2500)} · pagamento único`);
      }
      if (c.purpose === 'EMISSAO' && c.type === 'FINANCEIRA' && c.custoEmissao != null) {
        rowItem('Custo de emissão (CPR Financeira)', `${brl(c.custoEmissao)} · 3% do valor total`);
      }
      if (c.purpose === 'CAPTACAO') {
        rowItem('Fee ConectCampo (6%)', brl(c.conectcampoFeeValue));
      }
      y += 6;

      if (c.observacoes) {
        sectionTitle('Observações');
        doc.font('Helvetica').fontSize(9).fillColor(INK).text(String(c.observacoes), left, y, { width });
        y = doc.y + 10;
      }

      // Assinaturas
      y = Math.max(y + 24, doc.y + 24);
      const colW = (width - 30) / 2;
      doc.moveTo(left, y).lineTo(left + colW, y).lineWidth(0.8).strokeColor(INK).stroke();
      doc.moveTo(left + colW + 30, y).lineTo(right, y).lineWidth(0.8).strokeColor(INK).stroke();
      doc.font('Helvetica-Bold').fontSize(9).fillColor(INK);
      doc.text('Emitente', left, y + 5, { width: colW });
      doc.text('Credor', left + colW + 30, y + 5, { width: colW });
      doc.font('Helvetica').fontSize(8.5).fillColor(MUTED);
      doc.text(String(c.emitenteNome ?? ''), left, y + 18, { width: colW });
      doc.text(String(c.credorNome ?? ''), left + colW + 30, y + 18, { width: colW });

      // Rodapé / disclaimer
      const footY = doc.page.height - doc.page.margins.bottom - 38;
      doc.moveTo(left, footY).lineTo(right, footY).lineWidth(0.6).strokeColor(LINE).stroke();
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          'Documento gerado pela plataforma ConectCampo. A eficácia plena da Cédula de Produto Rural depende ' +
            'de emissão e, quando aplicável, registro no cartório competente e na entidade registradora ' +
            '(Lei nº 8.929/1994 e Lei nº 13.986/2020).',
          left,
          footY + 6,
          { width },
        );

      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}
