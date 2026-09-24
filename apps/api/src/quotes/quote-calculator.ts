import { Prisma } from '../generated/prisma/client.js';

const Decimal = Prisma.Decimal;
type DecimalInput = string | number | Prisma.Decimal;

export interface QuoteItemInput {
    description: string;
    unit?: string | null;
    quantity: DecimalInput;
    unitPrice: DecimalInput;
}

const round2 = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export function calculateQuote(items: QuoteItemInput[], taxRate: DecimalInput) {
    const lines = items.map((item, index) => {
        const quantity = new Decimal(item.quantity);
        const unitPrice = new Decimal(item.unitPrice);
        return {
            description: item.description,
            unit: item.unit ?? null,
            quantity,
            unitPrice,
            amount: round2(quantity.mul(unitPrice)),
            position: index,
        };
    });

    const subtotal = lines.reduce((sum, line) => sum.add(line.amount), new Decimal(0));
    const taxAmount = round2(subtotal.mul(taxRate).div(100));

    return {
        items: lines,
        totals: { subtotal, taxAmount, total: subtotal.add(taxAmount) },
    };
}

export function formatFolio(number: number, createdAt: Date) {
    return `COT-${createdAt.getFullYear()}-${String(number).padStart(4, '0')}`;
}