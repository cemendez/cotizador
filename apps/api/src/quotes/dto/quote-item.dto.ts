import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';

export class QuoteItemDto {
    @Trim()
    @IsString({ message: 'Cada concepto necesita descripción' })
    @MinLength(1)
    @MaxLength(500)
    description!: string;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    unit?: string | null;

    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Cantidad inválida (máximo 2 decimales)' })
    @Min(0.01)
    @Max(99_999_999)
    quantity!: number;

    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio inválido (máximo 2 decimales)' })
    @Min(0)
    @Max(9_999_999_999)
    unitPrice!: number;
}