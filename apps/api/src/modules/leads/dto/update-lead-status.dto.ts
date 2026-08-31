import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const LEAD_STATUSES = ['NOVO', 'CONTATADO', 'QUALIFICADO', 'CONVERTIDO', 'DESCARTADO'] as const;

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LEAD_STATUSES })
  @IsIn(LEAD_STATUSES)
  status: (typeof LEAD_STATUSES)[number];
}
