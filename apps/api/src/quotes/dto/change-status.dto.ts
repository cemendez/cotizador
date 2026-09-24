import { IsEnum } from 'class-validator';
import { QuoteStatus } from '../../generated/prisma/client.js';

export class ChangeStatusDto {
    @IsEnum(QuoteStatus, { message: 'Estado inválido' })
    status!: QuoteStatus;
}