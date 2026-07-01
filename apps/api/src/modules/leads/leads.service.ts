import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name,
        phone: dto.phone,
        amount: dto.amount,
        termMonths: dto.termMonths,
        source: dto.source ?? 'simulador',
      },
      select: { id: true, email: true, createdAt: true },
    });
    this.logger.log(`Novo lead capturado: ${lead.email} (${dto.source ?? 'simulador'})`);
    return { ok: true, id: lead.id };
  }

  async findAll(page = 1, perPage = 50, status?: string) {
    const where = status && status !== 'ALL' ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }
}
