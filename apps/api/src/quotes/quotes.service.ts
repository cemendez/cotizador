import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, QuoteStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { ListQuotesQueryDto } from './dto/list-quotes-query.dto.js';
import { UpdateQuoteDto } from './dto/update-quote.dto.js';
import { calculateQuote, formatFolio } from './quote-calculator.js';
import { PdfService } from '../pdf/pdf.service.js';
import { buildQuotePdf, type QuotePdfKind } from './quote-pdf.builder.js';

const listInclude = {
    client: { select: { id: true, name: true, company: true } },
} satisfies Prisma.QuoteInclude;

const detailInclude = {
    client: { select: { id: true, name: true, company: true, email: true, rfc: true } },
    items: { orderBy: { position: 'asc' } },
} satisfies Prisma.QuoteInclude;

const TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'DRAFT'],
    ACCEPTED: [],
    REJECTED: [],
    EXPIRED: [],
};

function withFolio<T extends { number: number; createdAt: Date }>(quote: T) {
    return { ...quote, folio: formatFolio(quote.number, quote.createdAt) };
}

@Injectable()
export class QuotesService {
    constructor(private readonly prisma: PrismaService, private readonly pdf: PdfService) { }

    async findAll(userId: string, query: ListQuotesQueryDto) {
        const { page, pageSize, status, clientId, search } = query;

        const where: Prisma.QuoteWhereInput = {
            userId,
            ...(status && { status }),
            ...(clientId && { clientId }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { client: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        };

        const [data, total] = await this.prisma.$transaction([
            this.prisma.quote.findMany({
                where,
                include: listInclude,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.quote.count({ where }),
        ]);

        return {
            data: data.map(withFolio),
            meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        };
    }

    async findOne(userId: string, id: string) {
        return withFolio(await this.findOwned(userId, id));
    }

    async create(userId: string, dto: CreateQuoteDto) {
        await this.assertClient(userId, dto.clientId);
        const { items, taxRate = 16, ...data } = dto;
        const calc = calculateQuote(items, taxRate);

        const quote = await this.prisma.$transaction(async (tx) => {
            // Incremento atómico: la fila del usuario queda bloqueada hasta terminar la transacción
            const { lastQuoteNumber } = await tx.user.update({
                where: { id: userId },
                data: { lastQuoteNumber: { increment: 1 } },
                select: { lastQuoteNumber: true },
            });

            return tx.quote.create({
                data: {
                    ...data,
                    userId,
                    number: lastQuoteNumber,
                    taxRate,
                    ...calc.totals,
                    items: { create: calc.items },
                },
                include: detailInclude,
            });
        });

        return withFolio(quote);
    }

    async update(userId: string, id: string, dto: UpdateQuoteDto) {
        const quote = await this.findOwned(userId, id);
        if (quote.status !== 'DRAFT') {
            throw new ConflictException('Solo se pueden editar cotizaciones en borrador');
        }

        const { items, taxRate, clientId, ...data } = dto;
        if (clientId) await this.assertClient(userId, clientId);

        // Recalcular si cambian los conceptos o la tasa (con los conceptos actuales si no se enviaron nuevos)
        const needsRecalc = items !== undefined || taxRate !== undefined;
        const calc = needsRecalc ? calculateQuote(items ?? quote.items, taxRate ?? quote.taxRate) : null;

        const updated = await this.prisma.quote.update({
            where: { id },
            data: {
                ...data,
                ...(clientId && { clientId }),
                ...(taxRate !== undefined && { taxRate }),
                ...(calc && calc.totals),
                // Reemplazo completo: borra los conceptos anteriores y crea los nuevos en la misma operación
                ...(items && calc && { items: { deleteMany: {}, create: calc.items } }),
            },
            include: detailInclude,
        });

        return withFolio(updated);
    }

    async changeStatus(userId: string, id: string, status: QuoteStatus) {
        const quote = await this.findOwned(userId, id);

        if (!TRANSITIONS[quote.status].includes(status)) {
            throw new ConflictException(`No se puede cambiar de ${quote.status} a ${status}`);
        }
        if (status === 'SENT' && quote.validUntil && quote.validUntil < new Date()) {
            throw new ConflictException('La fecha de vigencia ya pasó; actualízala antes de enviar');
        }

        const now = new Date();
        // La condición sobre el estado actual evita aplicar el cambio si otra petición lo modificó antes
        const { count } = await this.prisma.quote.updateMany({
            where: { id, userId, status: quote.status },
            data: {
                status,
                ...(status === 'SENT' && { sentAt: now }),
                ...(status === 'ACCEPTED' && { acceptedAt: now }),
                ...(status === 'DRAFT' && { sentAt: null }),
            },
        });
        if (count === 0) {
            throw new ConflictException('La cotización cambió mientras se procesaba; intenta de nuevo');
        }

        return this.findOne(userId, id);
    }

    async remove(userId: string, id: string) {
        const quote = await this.findOwned(userId, id);
        if (quote.status !== 'DRAFT') {
            throw new ConflictException('Solo se pueden eliminar borradores; las enviadas se conservan como historial');
        }
        await this.prisma.quote.delete({ where: { id } }); // los conceptos se borran en cascada
    }

    private async findOwned(userId: string, id: string) {
        const quote = await this.prisma.quote.findFirst({
            where: { id, userId },
            include: detailInclude,
        });
        if (!quote) throw new NotFoundException('Cotización no encontrada');
        return quote;
    }

    private async assertClient(userId: string, clientId: string) {
        const exists = await this.prisma.client.count({ where: { id: clientId, userId } });
        if (!exists) throw new NotFoundException('Cliente no encontrado');
    }

    async generatePdf(userId: string, id: string, kind: QuotePdfKind) {
        const quote = await this.findOwned(userId, id);

        if (kind === 'contract' && quote.status !== 'ACCEPTED') {
            throw new ConflictException('El contrato solo está disponible para cotizaciones aceptadas');
        }

        const issuer = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { name: true, businessName: true, rfc: true, email: true },
        });

        const folio = formatFolio(quote.number, quote.createdAt);
        const buffer = await this.pdf.render(buildQuotePdf({ ...quote, folio, issuer }, kind));

        return {
            buffer,
            filename: kind === 'contract' ? `${folio}-contrato.pdf` : `${folio}.pdf`,
        };
    }
}