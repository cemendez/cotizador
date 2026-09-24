import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';

export class ListClientsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize: number = 20;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string | null;
}