import { Injectable } from '@nestjs/common';
import { Prisma, QuoteStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { addDays, currentMonthRangeMx, todayMxAsDateOnly } from '../common/utils/mx-dates.js';
import { formatFolio } from '../quotes/quote-calculator.js';

const quoteCardSelect = {
    id: true,
    number: true,
    title: true,
    status: true,
    total: true,
    currency: true,
    validUntil: true,
    createdAt: true,
    updatedAt: true,
    client: { select: { name: true, company: true } },
} satisfies Prisma.QuoteSelect;

type MoneyGroup = { currency: string; _sum: { total: Prisma.Decimal | null }; _count: { _all: number } };

const toMoney = (groups: MoneyGroup[]) =>
    groups.map((group) => ({
        currency: group.currency,
        total: (group._sum.total ?? new Prisma.Decimal(0)).toString(),
        count: group._count._all,
    }));

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async summary(userId: string) {
        const month = currentMonthRangeMx();
        const today = todayMxAsDateOnly();

        // Consultas independientes: se ejecutan en paralelo
        const [clients, byStatus, acceptedThisMonth, pending, expiringSoon, recent] = await Promise.all([
            this.prisma.client.count({ where: { userId } }),
            this.prisma.quote.groupBy({
                by: ['status'],
                where: { userId },
                _count: { _all: true },
            }),
            this.prisma.quote.groupBy({
                by: ['currency'],
                where: { userId, status: 'ACCEPTED', acceptedAt: { gte: month.start, lt: month.end } },
                _sum: { total: true },
                _count: { _all: true },
            }),
            this.prisma.quote.groupBy({
                by: ['currency'],
                where: { userId, status: 'SENT' },
                _sum: { total: true },
                _count: { _all: true },
            }),
            this.prisma.quote.findMany({
                where: { userId, status: 'SENT', validUntil: { gte: today, lte: addDays(today, 7) } },
                orderBy: { validUntil: 'asc' },
                take: 5,
                select: quoteCardSelect,
            }),
            this.prisma.quote.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: quoteCardSelect,
            }),
        ]);

        // Todos los estados aparecen, aunque tenga 0
        const statusCounts = Object.fromEntries(Object.values(QuoteStatus).map((status) => [status, 0])) as Record<QuoteStatus, number>;

        for (const group of byStatus) statusCounts[group.status] = group._count._all;

        const withFolio = <T extends { number: number; createdAt: Date }>(quote: T) => ({
            ...quote,
            folio: formatFolio(quote.number, quote.createdAt),
        });

        return {
            clients,
            statusCounts,
            acceptedThisMonth: toMoney(acceptedThisMonth),
            pending: toMoney(pending),
            expiringSoon: expiringSoon.map(withFolio),
            recent: recent.map(withFolio),
        }
    }
}