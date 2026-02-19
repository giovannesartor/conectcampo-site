import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async upload(userId: string, data: {
    operationId?: string;
    type: string;
    fileName: string;
    fileKey: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    checksum?: string;
  }) {
    // Verificar versionamento
    let version = 1;
    if (data.operationId) {
      const existing = await this.prisma.document.findFirst({
        where: {
          operationId: data.operationId,
          type: data.type as any,
          deletedAt: null,
        },
        orderBy: { version: 'desc' },
      });
      if (existing) {
        version = existing.version + 1;
      }
    }

    return this.prisma.document.create({
      data: {
        userId,
        operationId: data.operationId,
        type: data.type as any,
        fileName: data.fileName,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        checksum: data.checksum,
        version,
      },
    });
  }

  async findByOperation(operationId: string) {
    return this.prisma.document.findMany({
      where: { operationId, deletedAt: null },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });
  }

  async findByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async grantAccess(documentId: string, partnerId: string, expiresAt?: Date) {
    return this.prisma.documentAccess.upsert({
      where: {
        documentId_partnerId: { documentId, partnerId },
      },
      create: { documentId, partnerId, expiresAt },
      update: { expiresAt },
    });
  }

  async verify(documentId: string, verifiedBy: string) {
    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  }

  async softDelete(documentId: string) {
    return this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });
  }
}
