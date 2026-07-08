import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Página (1-based)', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Monta o envelope padronizado { data, meta }. */
export function paginated<T>(data: T[], total: number, page: number, perPage: number): Paginated<T> {
  return {
    data,
    meta: { total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  };
}

/** Normaliza page/perPage aplicando limites seguros. Retorna também skip/take. */
export function resolvePagination(page?: number, perPage?: number, defaultPerPage = 20) {
  const p = Math.max(1, Number(page) || 1);
  const pp = Math.min(100, Math.max(1, Number(perPage) || defaultPerPage));
  return { page: p, perPage: pp, skip: (p - 1) * pp, take: pp };
}

/** Indica se o cliente solicitou paginação (para respostas retrocompatíveis).
 *  Retorna true somente quando page ou perPage é um número finito válido,
 *  ignorando undefined, null e NaN (que chegam quando o ValidationPipe com
 *  enableImplicitConversion: true converte query params ausentes). */
export function wantsPagination(page?: unknown, perPage?: unknown): boolean {
  return Number.isFinite(Number(page)) || Number.isFinite(Number(perPage));
}
