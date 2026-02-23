import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET', 'conectcampo-docs');
    const region = this.configService.get<string>('AWS_REGION', 'sa-east-1');

    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  /**
   * Gera URL pré-assinada para upload direto do frontend
   */
  async getPresignedUploadUrl(
    userId: string,
    fileName: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const ext = fileName.split('.').pop() || 'bin';
    const fileKey = `documents/${userId}/${uuidv4()}.${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        ContentType: mimeType,
        Metadata: { userId, originalName: fileName },
      });

      const uploadUrl = await getSignedUrl(this.s3, command, {
        expiresIn: 600, // 10 min
      });

      this.logger.log(`Presigned upload URL generated: ${fileKey}`);

      return { uploadUrl, fileKey };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${(error as Error).message}`);
      throw new InternalServerErrorException('Erro ao gerar URL de upload');
    }
  }

  /**
   * Gera URL pré-assinada para download
   */
  async getPresignedDownloadUrl(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      return getSignedUrl(this.s3, command, {
        expiresIn: 3600, // 1 hora
      });
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${(error as Error).message}`);
      throw new InternalServerErrorException('Erro ao gerar URL de download');
    }
  }

  /**
   * Exclui objeto do S3
   */
  async deleteObject(fileKey: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: fileKey,
        }),
      );
      this.logger.log(`Object deleted: ${fileKey}`);
    } catch (error) {
      this.logger.error(`Failed to delete object: ${(error as Error).message}`);
    }
  }

  /**
   * Retorna a URL pública (se o bucket tiver acesso público)
   */
  getPublicUrl(fileKey: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${fileKey}`;
  }
}
