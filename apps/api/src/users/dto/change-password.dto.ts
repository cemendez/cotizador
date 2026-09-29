import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Ingresa tu ccontraseña actual' })
    currentPassword!: string;

    @IsString()
    @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
    @MaxLength(72)
    newPassword!: string;
}