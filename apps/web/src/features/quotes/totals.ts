interface ItemValues {
    quantity: number;
    unitPrice: number;
}

const toHundredths = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100);

export function calculateTotals(items: ItemValues[], taxRate: number) {
    const amounts = items.map((item) =>
        Math.round((toHundredths(item.quantity) * toHundredths(item.unitPrice)) / 100),
    );
    const subtotal = amounts.reduce((sum, cents) => sum + cents, 0);
    const taxAmount = Math.round((subtotal * toHundredths(taxRate)) / 10_000);

    return {
        amounts: amounts.map((cents) => cents / 100),
        subtotal: subtotal / 100,
        taxAmount: taxAmount / 100,
        total: (subtotal + taxAmount) / 100,
    }
}