import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserRole,
  Prisma,
  DocExtractionType,
  DocExtractionStatus,
} from '@prisma/client';
import { CreateExtractionDto } from './dto/create-extraction.dto';

@Injectable()
export class SmartDocsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(id: string, userId: string, role: string) {
    const doc = await this.prisma.documentExtraction.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) throw new NotFoundException('Documento não encontrado');
    if (role !== UserRole.ADMIN && doc.userId !== userId) {
      throw new ForbiddenException('Acesso negado');
    }
    return doc;
  }

  /**
   * Extração heurística de campos-chave a partir do texto do documento.
   * Determinística e sem dependências externas — extensível para IA/OCR real.
   */
  private extractFields(text: string): { fields: Record<string, unknown>; confidence: number } {
    const fields: Record<string, unknown> = {};
    let hits = 0;

    const cpf = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
    if (cpf) { fields.cpf = cpf[0]; hits++; }

    const cnpj = text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
    if (cnpj) { fields.cnpj = cnpj[0]; hits++; }

    // CAR: UF-0000000-XXXX... (formato do Cadastro Ambiental Rural)
    const car = text.match(/\b[A-Z]{2}-\d{7}-[0-9A-F.]{4,}\b/i);
    if (car) { fields.car = car[0]; hits++; }

    const matricula = text.match(/matr[íi]cula\s*(?:n[ºo.]*)?\s*([\d.]+)/i);
    if (matricula) { fields.matricula = matricula[1]; hits++; }

    const datas = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g);
    if (datas?.length) { fields.datas = Array.from(new Set(datas)).slice(0, 6); hits++; }

    const valores = text.match(/R\$\s?[\d.]+(?:,\d{2})?/g);
    if (valores?.length) { fields.valores = Array.from(new Set(valores)).slice(0, 6); hits++; }

    const area = text.match(/([\d.,]+)\s*(?:ha|hectares)\b/i);
    if (area) { fields.areaHa = area[1]; hits++; }

    const inscricao = text.match(/inscri[çc][ãa]o\s*(?:estadual|rural)?\s*[:.]?\s*([\d.\-\/]+)/i);
    if (inscricao) { fields.inscricao = inscricao[1]; hits++; }

    const confidence = Math.min(0.98, 0.4 + hits * 0.09);
    return { fields, confidence };
  }

  private guessType(fileName: string, text: string): DocExtractionType {
    const s = `${fileName} ${text}`.toLowerCase();
    if (s.includes('matríc') || s.includes('matric')) return DocExtractionType.MATRICULA;
    if (s.includes('cadastro ambiental') || s.includes('car')) return DocExtractionType.CAR;
    if (s.includes('nota fiscal') || s.includes('nfe') || s.includes('danfe')) return DocExtractionType.NOTA_FISCAL;
    if (s.includes('cpr') || s.includes('cédula de produto')) return DocExtractionType.CPR;
    if (s.includes('contrato')) return DocExtractionType.CONTRATO;
    if (s.includes('laudo')) return DocExtractionType.LAUDO;
    return DocExtractionType.OUTRO;
  }

  private buildSummary(type: DocExtractionType, fields: Record<string, unknown>): string {
    const parts: string[] = [];
    if (fields.cnpj) parts.push(`CNPJ ${fields.cnpj}`);
    else if (fields.cpf) parts.push(`CPF ${fields.cpf}`);
    if (fields.matricula) parts.push(`matrícula ${fields.matricula}`);
    if (fields.car) parts.push(`CAR ${fields.car}`);
    if (fields.areaHa) parts.push(`${fields.areaHa} ha`);
    const detail = parts.length ? ` — ${parts.join(', ')}` : '';
    return `Documento classificado como ${type}${detail}.`;
  }

  async create(userId: string, dto: CreateExtractionDto) {
    const text = dto.rawText ?? '';
    const hasText = text.trim().length > 0;

    const docType = dto.docType ?? this.guessType(dto.fileName, text);
    const { fields, confidence } = hasText
      ? this.extractFields(text)
      : { fields: {}, confidence: 0 };

    return this.prisma.documentExtraction.create({
      data: {
        userId,
        fileName: dto.fileName,
        docType,
        status: hasText ? DocExtractionStatus.CONCLUIDO : DocExtractionStatus.PENDENTE,
        rawText: hasText ? text.slice(0, 20000) : null,
        extracted: fields as Prisma.InputJsonValue,
        summary: hasText ? this.buildSummary(docType, fields) : null,
        confidence: hasText ? confidence : null,
      },
    });
  }

  async findAll(userId: string, role: string) {
    const where: Prisma.DocumentExtractionWhereInput = { deletedAt: null };
    if (role !== UserRole.ADMIN) where.userId = userId;
    return this.prisma.documentExtraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    return this.assertOwner(id, userId, role);
  }

  async remove(id: string, userId: string, role: string) {
    await this.assertOwner(id, userId, role);
    await this.prisma.documentExtraction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
