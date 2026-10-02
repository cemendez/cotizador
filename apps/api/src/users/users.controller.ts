import { Body, Controller, HttpCode, Patch } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js'
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
import { Throttle } from '@nestjs/throttler';
import { STRICT_LIMITS } from '../common/throttle-limits.js';

@Controller('users/me')
export class UsersController {
    constructor(private readonly users: UsersService) { }

    @Patch()
    updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
        return this.users.updateProfile(user.id, dto);
    }

    @Throttle(STRICT_LIMITS.changePassword)
    @Patch('password')
    @HttpCode(204)
    changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
        return this.users.changePassword(user.id, dto);
    }
}