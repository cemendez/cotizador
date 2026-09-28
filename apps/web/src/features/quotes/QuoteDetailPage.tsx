import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { formatDate, formatDateOnly, formatMoney } from '../../lib/format';
import type { QuoteStatus } from '../../types/api';
import { openPdf, useChangeQuoteStatus, useDeleteQuote, useQuote } from './api';
import { STATUS_ACTIONS, STATUS_CONFIRM, STATUS_LABELS } from './status';
import { StatusBadge } from './StatusBadge';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-900">{children}</dd>
        </div>
    );
}

export function QuoteDetailPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { data: quote, isPending, isError, error } = useQuote(id);
    const changeStatus = useChangeQuoteStatus(id);
    const deleteQuote = useDeleteQuote();

    const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);

    if (isPending) return <p className="text-sm text-slate-500">Cargando…</p>;
    if (isError) return <ErrorAlert message={error.message} />;

    const money = (value: string) => formatMoney(value, quote.currency);
    const isDraft = quote.status === 'DRAFT';

    const handlePdf = async (kind: 'pdf' | 'contract') => {
        setPdfError(null);
        try {
            await openPdf(`/quotes/${id}/${kind}`);
        } catch (err) {
            setPdfError(err instanceof Error ? err.message : 'No se pudo generar el PDF');
        }
    };

    const closeStatusDialog = () => {
        setPendingStatus(null);
        changeStatus.reset();
    };

    const confirmStatus = () => {
        if (pendingStatus) changeStatus.mutate(pendingStatus, { onSuccess: closeStatusDialog });
    };

    const handleDelete = () => {
        deleteQuote.mutate(id, { onSuccess: () => navigate('/quotes', { replace: true }) });
    };

    return (
        <div className="space-y-6">
            <div>
                <Link to="/quotes" className="text-sm text-indigo-600 hover:underline">
                    ← Cotizaciones
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h1 className="font-mono text-2xl font-semibold text-slate-900">{quote.folio}</h1>
                    <StatusBadge status={quote.status} />
                </div>
                <p className="mt-1 text-slate-600">{quote.title}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS[quote.status].map((action) => (
                    <Button key={action.to} variant={action.variant} onClick={() => setPendingStatus(action.to)}>
                        {action.label}
                    </Button>
                ))}
                {isDraft && (
                    <Link
                        to={`/quotes/${id}/edit`}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Editar
                    </Link>
                )}
                <Button variant="secondary" onClick={() => handlePdf('pdf')}>
                    Ver cotización PDF
                </Button>
                {quote.status === 'ACCEPTED' && (
                    <Button variant="secondary" onClick={() => handlePdf('contract')}>
                        Ver contrato PDF
                    </Button>
                )}
                {isDraft && (
                    <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                        Eliminar
                    </Button>
                )}
            </div>

            {pdfError && <ErrorAlert message={pdfError} />}

            <div className="grid gap-6 lg:grid-cols-3">
                <section className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200 lg:col-span-2">
                    <h2 className="font-semibold text-slate-900">Conceptos</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 text-left text-slate-600">
                                <tr>
                                    <th className="py-2 font-medium">Descripción</th>
                                    <th className="py-2 text-right font-medium">Cantidad</th>
                                    <th className="py-2 text-right font-medium">P. unitario</th>
                                    <th className="py-2 text-right font-medium">Importe</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {quote.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2 pr-4">{item.description}</td>
                                        <td className="py-2 text-right tabular-nums whitespace-nowrap">
                                            {Number(item.quantity)} {item.unit}
                                        </td>
                                        <td className="py-2 text-right tabular-nums">{money(item.unitPrice)}</td>
                                        <td className="py-2 text-right font-medium tabular-nums">{money(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <dl className="ml-auto w-full max-w-xs space-y-1 border-t border-slate-200 pt-4 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-600">Subtotal</dt>
                            <dd className="tabular-nums">{money(quote.subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-600">IVA ({Number(quote.taxRate)}%)</dt>
                            <dd className="tabular-nums">{money(quote.taxAmount)}</dd>
                        </div>
                        <div className="flex justify-between text-base font-semibold">
                            <dt>Total</dt>
                            <dd className="tabular-nums">{money(quote.total)}</dd>
                        </div>
                    </dl>
                </section>

                <aside className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                    <h2 className="font-semibold text-slate-900">Información</h2>
                    <dl className="space-y-3">
                        <InfoRow label="Cliente">
                            {quote.client.company ?? quote.client.name}
                            {quote.client.company && <span className="block text-slate-500">{quote.client.name}</span>}
                        </InfoRow>
                        {quote.client.rfc && <InfoRow label="RFC">{quote.client.rfc}</InfoRow>}
                        <InfoRow label="Moneda">{quote.currency}</InfoRow>
                        <InfoRow label="Creada">{formatDate(quote.createdAt)}</InfoRow>
                        {quote.validUntil && <InfoRow label="Vigencia">{formatDateOnly(quote.validUntil)}</InfoRow>}
                        {quote.sentAt && <InfoRow label="Enviada">{formatDate(quote.sentAt)}</InfoRow>}
                        {quote.acceptedAt && <InfoRow label="Aceptada">{formatDate(quote.acceptedAt)}</InfoRow>}
                    </dl>
                </aside>
            </div>

            {(quote.terms || quote.notes) && (
                <section className="grid gap-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200 sm:grid-cols-2">
                    {quote.terms && (
                        <div>
                            <h2 className="font-semibold text-slate-900">Términos y condiciones</h2>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{quote.terms}</p>
                        </div>
                    )}
                    {quote.notes && (
                        <div>
                            <h2 className="font-semibold text-slate-900">Notas</h2>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{quote.notes}</p>
                        </div>
                    )}
                </section>
            )}

            <ConfirmDialog
                open={pendingStatus !== null}
                title={pendingStatus ? `Cambiar a "${STATUS_LABELS[pendingStatus]}"` : ''}
                confirmLabel="Confirmar"
                confirmVariant="primary"
                loading={changeStatus.isPending}
                error={changeStatus.error?.message}
                onConfirm={confirmStatus}
                onClose={closeStatusDialog}
            >
                {pendingStatus && STATUS_CONFIRM[pendingStatus]}
            </ConfirmDialog>

            <ConfirmDialog
                open={confirmDelete}
                title="Eliminar borrador"
                loading={deleteQuote.isPending}
                error={deleteQuote.error?.message}
                onConfirm={handleDelete}
                onClose={() => {
                    setConfirmDelete(false);
                    deleteQuote.reset();
                }}
            >
                ¿Seguro que quieres eliminar <strong>{quote.folio}</strong>? Esta acción no se puede deshacer.
            </ConfirmDialog>
        </div>
    );
}