import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdatePricingDto } from './dto/update-pricing.dto.js';

const pricingSelect = {
    monthlyNetIncome: true,
    costEquipment: true,
    costTools: true,
    costOffice: true,
    costTransport: true,
    costServices: true,
    costAdvertising: true,
    marginPercent: true,
    taxReservePercent: true,
    billableHoursPerMonth: true,
    hourlyRate: true,
    updatedAt: true,
} satisfies Prisma.PricingSettingsSelect;

const DEFAULT_PRICING = {
    monthlyNetIncome: '28000',
    costEquipment: '0',
    costTools: '0',
    costOffice: '0',
    costTransport: '0',
    costServices: '0',
    costAdvertising: '0',
    marginPercent: '10',
    taxReservePercent: '0',
    billableHoursPerMonth: '100',
    hourlyRate: null,
    updatedAt: null,
};

@Injectable()
export class PricingService {
    constructor(private readonly prisma: PrismaService) { }

    async get(userId: string) {
        const settings = await this.prisma.pricingSettings.findUnique({ where: { userId }, select: pricingSelect });
        return settings ?? DEFAULT_PRICING;
    }

    save(userId: string, dto: UpdatePricingDto) {
        return this.prisma.pricingSettings.upsert({
            where: { userId },
            create: { ...dto, userId },
            update: dto,
            select: pricingSelect,
        });
    }
}