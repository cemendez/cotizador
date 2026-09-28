import { Link, useParams, useSearchParams } from 'react-router';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { useQuote } from './api';
import { QuoteForm } from './QuoteForm';

export function QuoteFormPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEdit = Boolean(id);
    const { data: quote, isPending, isError, error } = useQuote(id);
    const backTo = isEdit ? `/quotes/${id}` : '/quotes';

    return (
        <div className="space-y-6">
            <div>
                <Link to={backTo} className="text-sm text-indigo-600 hover:underline">
                    ← {isEdit ? 'Volver a la cotización' : 'Cotizaciones'}
                </Link>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                    {isEdit ? `Editar ${quote?.folio ?? 'cotización'}` : 'Nueva cotización'}
                </h1>
            </div>

            {isEdit && isPending && <p className="text-sm text-slate-500">Cargando…</p>}
            {isEdit && isError && <ErrorAlert message={error.message} />}

            {isEdit && quote && quote.status !== 'DRAFT' ? (
                <ErrorAlert message="Solo se pueden editar cotizaciones en borrador." />
            ) : (
                (!isEdit || quote) && (
                    <QuoteForm
                        key={quote?.id ?? 'new'}
                        quote={quote}
                        initialClientId={searchParams.get('clientId') ?? ''}
                        cancelTo={backTo}
                    />
                )
            )}
        </div>
    );
}