import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';

export class CreateClientDto {
    @Trim()
    @IsString({ message: 'El nombre es obligatorio' })
    @MinLength(2)
    @MaxLength(150)
    name!: string;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(150)
    company?: string | null;

    @Trim()
    @IsOptional()
    @IsEmail({}, { message: 'Correo inválido' })
    email?: string | null;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string | null;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase() || null : value,
    )
    @IsOptional()
    @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, { message: 'RFC con formato inválido' })
    rfc?: string | null;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    address?: string | null;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string | null;
}