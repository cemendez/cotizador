import type { QuoteStatus } from '../../types/api';
import { STATUS_LABELS, STATUS_STYLES } from './status';

export function StatusBadge({ status }: { status: QuoteStatus }) {
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
        </span>
    )
}