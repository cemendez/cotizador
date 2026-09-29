import { Controller, Get } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboard: DashboardService) { }

    @Get()
    summary(@CurrentUser() user: AuthUser) {
        return this.dashboard.summary(user.id);
    }
}