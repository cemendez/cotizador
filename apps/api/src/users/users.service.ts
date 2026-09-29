import { BadRequestException, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { publicUser } from './public-user.js';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    updateProfile(userId: string, dto: UpdateProfileDto) {
        return this.prisma.user.update({ where: { id: userId }, data: dto, select: publicUser });
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

        if (!(await verify(user.passwordHash, dto.currentPassword))) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        const passwordHash = await hash(dto.newPassword);

        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
            this.prisma.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            })
        ])
    }
}