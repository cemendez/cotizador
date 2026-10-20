import { Body, Controller, Get, Put } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdatePricingDto } from './dto/update-pricing.dto.js';
import { PricingService } from './pricing.service.js';

@Controller('pricing')
export class PricingController {
    constructor(private readonly pricing: PricingService) { }

    @Get()
    get(@CurrentUser() user: AuthUser) {
        return this.pricing.get(user.id);
    }

    @Put()
    save(@CurrentUser() user: AuthUser, @Body() dto: UpdatePricingDto) {
        return this.pricing.save(user.id, dto);
    }
}