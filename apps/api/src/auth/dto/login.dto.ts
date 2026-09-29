import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { NormalizeEmail } from '../../common/decorators/normalize-email.decorator.js';

export class LoginDto {
    @NormalizeEmail()
    @IsEmail()
    email!: string;

    @IsString()
    @IsNotEmpty()
    password!: string;
}