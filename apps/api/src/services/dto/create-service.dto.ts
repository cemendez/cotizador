import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';
import { Money } from '../../common/validation/money.js';

export class CreateServiceDto {
    @Trim()
    @IsString({ message: 'El nombre es obligatorio' })
    @MinLength(2)
    @MaxLength(120)
    name!: string;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string | null;

    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Horas inválidas (máximo 2 decimales)' })
    @Min(0.25)
    @Max(2000)
    estimatedHours!: number;

    // null = sin precio fijo: el precio se calcula como horas × tu tarifa
    @IsOptional()
    @Money()
    fixedPrice?: number | null;
}