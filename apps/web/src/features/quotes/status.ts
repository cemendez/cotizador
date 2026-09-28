import type { QuoteStatus } from '../../types/api';

export const STATUS_LABELS: Record<QuoteStatus, string> = {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    ACCEPTED: 'Aceptada',
    REJECTED: 'Rechazada',
    EXPIRED: 'Vencida',
};

export const STATUS_STYLES: Record<QuoteStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-amber-100 text-amber-700',
};

interface StatusAction {
    to: QuoteStatus;
    label: string;
    variant: 'primary' | 'secondary';
}

export const STATUS_ACTIONS: Record<QuoteStatus, StatusAction[]> = {
    DRAFT: [{ to: 'SENT', label: 'Marcar como enviada', variant: 'primary' }],
    SENT: [
        { to: 'ACCEPTED', label: 'Marcar como aceptada', variant: 'primary' },
        { to: 'REJECTED', label: 'Rechazada', variant: 'secondary' },
        { to: 'EXPIRED', label: 'Vencida', variant: 'secondary' },
        { to: 'DRAFT', label: 'Regresar a borrador', variant: 'secondary' },
    ],
    ACCEPTED: [],
    REJECTED: [],
    EXPIRED: [],
};

export const STATUS_CONFIRM: Record<QuoteStatus, string> = {
    SENT: 'Los conceptos ya no se podrán editar. Si necesitas corregir algo, podrás regresarla a borrador.',
    ACCEPTED: 'La cotización quedará cerrada y podrás generar el contrato. Esta acción no se puede deshacer.',
    REJECTED: 'La cotización quedará cerrada como rechazada. Esta acción no se puede deshacer.',
    EXPIRED: 'La cotización quedará cerrada como vencida. Esta acción no se puede deshacer.',
    DRAFT: 'La cotización volverá a ser editable.',
};