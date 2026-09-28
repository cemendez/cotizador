export const formatMoney = (value: string | number, currency = "MXN") =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value));

export const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(iso));

export const formatDateOnly = (iso: string) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));