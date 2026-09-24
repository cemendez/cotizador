import { Type } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsDate, IsIn, IsNumber, IsOptional, IsString,
    IsUUID, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';
import { QuoteItemDto } from './quote-item.dto.js';

export class CreateQuoteDto {
    @IsUUID('4', { message: 'Cliente inválido' })
    clientId!: string;

    @Trim()
    @IsString({ message: 'El título es obligatorio' })
    @MinLength(3)
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsIn(['MXN', 'USD'])
    currency?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    taxRate?: number;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string | null;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(10000)
    terms?: string | null;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'Fecha de vigencia inválida' })
    validUntil?: Date | null;

    @IsArray()
    @ArrayMinSize(1, { message: 'Agrega al menos un concepto' })
    @ArrayMaxSize(100)
    @ValidateNested({ each: true })
    @Type(() => QuoteItemDto)
    items!: QuoteItemDto[];
}