import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Trim } from '../../common/decorators/trim.decorator.js'
import { RFC_REGEX } from "../../common/validation/rfc.js";
import { OptionalNotNull } from "../../common/decorators/optional-not-null.decorator.js";

export class UpdateProfileDto {
    @Trim()
    @OptionalNotNull()
    @IsString({ message: 'El nombre es obligatorio' })
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @Trim()
    @IsOptional()
    @IsString()
    @MaxLength(150)
    businessName?: string | null;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() || null : value))
    @IsOptional()
    @Matches(RFC_REGEX, { message: 'RFC con formato inválido' })
    rfc?: string | null;
}