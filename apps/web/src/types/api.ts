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
    meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPage: number;
    };
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