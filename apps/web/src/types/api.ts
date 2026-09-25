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