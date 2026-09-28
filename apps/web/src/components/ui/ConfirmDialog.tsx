import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button'
import { ErrorAlert } from './ErrorAlert'

interface Props {
    open: boolean;
    title: string;
    children: ReactNode;
    confirmLabel?: string;
    loading?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmDialog({
    open,
    title,
    children,
    confirmLabel = 'Eliminar',
    loading = false,
    error,
    onConfirm,
    onClose,
}: Props) {
    const ref = useRef<HTMLDialogElement>(null);

    // sincroniza la prop `open` con la API imperativa del <dialog>
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open])

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            className="m-auto w-full max-w-md rounded-2xl p-6 shadow-xl backdrop:bg-slate-900/40"
        >
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-2 text-sm text-slate-600">{children}</div>
            {error && <ErrorAlert message={error} className="mt-4" />}
            <div className="mt-6 flex-justify-end gap-2">
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="danger" onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </div>
        </dialog>
    );
}