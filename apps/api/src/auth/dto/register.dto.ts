import { IsEmail, IsString, maxLength, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Correo inválido' })
    email!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @IsString()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @MaxLength(72)
    password!: string;
}