import { Button } from './Button'

interface Props {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: Props) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
                {total} resultados · Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    Anterior
                </Button>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    Siguiente
                </Button>
            </div>
        </div>
    )
}