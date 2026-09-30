export interface User {
    id: string;
    email: string;
    name: string;
    businessName: string | null;
    rfc: string | null;
    createdAt: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export interface Paginated<T> {
    data: T[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface Client {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    rfc: string | null;
    address: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: { quotes: number };
}

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface QuoteItem {
    id: string;
    description: string;
    unit: string | null;
    quantity: string;
    unitPrice: string;
    amount: string;
    position: number;
}

export interface QuoteSummary {
    id: string;
    number: number;
    folio: string;
    title: string;
    status: QuoteStatus;
    currency: string;
    taxRate: string;
    subtotal: string;
    taxAmount: string;
    total: string;
    validUntil: string | null;
    sentAt: string | null;
    acceptedAt: string | null;
    createdAt: string;
    updatedAt: string;
    client: { id: string; name: string; company: string | null };
}

export interface Quote extends QuoteSummary {
    clientId: string;
    notes: string | null;
    terms: string | null;
    client: QuoteSummary['client'] & { email: string | null; rfc: string | null };
    items: QuoteItem[];
}

export interface MoneyByCurrency {
    currency: string;
    total: string;
    count: number;
}

export interface DashboardQuote {
    id: string;
    folio: string;
    title: string;
    status: QuoteStatus;
    total: string;
    currency: string;
    validUntil: string | null;
    updatedAt: string;
    client: { name: string; company: string | null };
}

export interface DashboardSummary {
    clients: number;
    statusCounts: Record<QuoteStatus, number>;
    acceptedThisMonth: MoneyByCurrency[];
    pending: MoneyByCurrency[];
    expiringSoon: DashboardQuote[];
    recent: DashboardQuote[];
}