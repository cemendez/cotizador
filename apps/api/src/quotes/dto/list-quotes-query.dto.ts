import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { QuoteStatus } from '../../generated/prisma/client.js';

export class ListQuotesQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsEnum(QuoteStatus)
    status?: QuoteStatus;

    @IsOptional()
    @IsUUID('4')
    clientId?: string;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string | null;
}