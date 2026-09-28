import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { SelectField } from '../../components/ui/SelectField';
import { TextAreaField } from '../../components/ui/TextAreaField';
import { TextField } from '../../components/ui/TextField';
import { formatMoney } from '../../lib/format';
import type { Quote } from '../../types/api';
import { useClientOptions } from '../clients/api';
import { useSaveQuote } from './api';
import { calculateTotals } from './totals';

const twoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const numberField = () => z.number({ error: 'Número inválido' });

const itemSchema = z.object({
    description: z.string().trim().min(1, 'Describe el concepto').max(500),
    unit: z.string().trim().max(30),
    quantity: numberField().min(0.01, 'Debe ser mayor a 0').max(99_999_999).refine(twoDecimals, 'Máximo 2 decimales'),
    unitPrice: numberField().min(0, 'No puede ser negativo').max(9_999_999_999).refine(twoDecimals, 'Máximo 2 decimales'),
});

const schema = z.object({
    clientId: z.string().min(1, 'Selecciona un cliente'),
    title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(200),
    currency: z.enum(['MXN', 'USD']),
    taxRate: numberField().min(0, 'Entre 0 y 100').max(100, 'Entre 0 y 100'),
    validUntil: z.string(),
    terms: z.string().trim().max(10_000),
    notes: z.string().trim().max(2_000),
    items: z.array(itemSchema).min(1, 'Agrega al menos un concepto').max(100, 'Máximo 100 conceptos'),
});

type FormValues = z.infer<typeof schema>;

const emptyItem = () => ({ description: '', unit: '', quantity: 1, unitPrice: 0 });

// YYYY-MM-DD en hora local (el formato "en-CA" produce exactamente eso)
const dateInDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-CA');
};

function toFormValues(quote?: Quote, initialClientId = ''): FormValues {
    if (!quote) {
        return {
            clientId: initialClientId,
            title: '',
            currency: 'MXN',
            taxRate: 16,
            validUntil: dateInDays(30),
            terms: '',
            notes: '',
            items: [emptyItem()],
        };
    }
    return {
        clientId: quote.clientId,
        title: quote.title,
        currency: quote.currency === 'USD' ? 'USD' : 'MXN',
        taxRate: Number(quote.taxRate),
        validUntil: quote.validUntil?.slice(0, 10) ?? '',
        terms: quote.terms ?? '',
        notes: quote.notes ?? '',
        items: quote.items.map((item) => ({
            description: item.description,
            unit: item.unit ?? '',
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
        })),
    };
}

const cellClass = (hasError: boolean) =>
    `w-full rounded-lg border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${hasError ? 'border-red-500' : 'border-slate-300'
    }`;

interface Props {
    quote?: Quote;
    initialClientId?: string;
    cancelTo: string;
}

export function QuoteForm({ quote, initialClientId, cancelTo }: Props) {
    const navigate = useNavigate();
    const saveQuote = useSaveQuote(quote?.id);
    const { data: clients, isPending: loadingClients } = useClientOptions();

    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: toFormValues(quote, initialClientId),
    });

    const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });

    // useWatch re-renderiza solo cuando cambian estos valores: base de los totales en vivo
    const items = useWatch({ control, name: 'items' });
    const taxRate = useWatch({ control, name: 'taxRate' });
    const currency = useWatch({ control, name: 'currency' });
    const totals = calculateTotals(items ?? [], taxRate);
    const money = (value: number) => formatMoney(value, currency);

    const onSubmit = async (values: FormValues) => {
        try {
            const saved = await saveQuote.mutateAsync({ ...values, validUntil: values.validUntil || null });
            navigate(`/quotes/${saved.id}`);
        } catch (error) {
            setError('root', { message: error instanceof Error ? error.message : 'Error inesperado' });
        }
    };

    const itemsError = errors.items?.message ?? errors.items?.root?.message;

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            {errors.root && <ErrorAlert message={errors.root.message ?? ''} />}

            <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="font-semibold text-slate-900">Datos generales</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1">
                        <SelectField label="Cliente *" error={errors.clientId?.message} disabled={loadingClients} {...register('clientId')}>
                            <option value="">{loadingClients ? 'Cargando…' : 'Selecciona un cliente'}</option>
                            {clients?.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.company ? `${client.company} (${client.name})` : client.name}
                                </option>
                            ))}
                        </SelectField>
                        <Link to="/clients/new" className="text-xs text-indigo-600 hover:underline">
                            + Registrar cliente nuevo
                        </Link>
                    </div>
                    <TextField label="Título *" error={errors.title?.message} {...register('title')} />
                    <SelectField label="Moneda" {...register('currency')}>
                        <option value="MXN">MXN — Peso mexicano</option>
                        <option value="USD">USD — Dólar estadounidense</option>
                    </SelectField>
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="IVA (%)"
                            type="number"
                            step="0.01"
                            error={errors.taxRate?.message}
                            {...register('taxRate', { valueAsNumber: true })}
                        />
                        <TextField label="Vigencia" type="date" {...register('validUntil')} />
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="font-semibold text-slate-900">Conceptos</h2>

                <div className="hidden grid-cols-12 gap-2 text-xs font-medium uppercase text-slate-500 sm:grid">
                    <span className="col-span-5">Descripción</span>
                    <span className="col-span-1">Unidad</span>
                    <span className="col-span-2">Cantidad</span>
                    <span className="col-span-2">P. unitario</span>
                    <span className="col-span-1 text-right">Importe</span>
                    <span className="col-span-1" />
                </div>

                {fields.map((field, index) => {
                    const itemErrors = errors.items?.[index];
                    return (
                        <div
                            key={field.id}
                            className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 p-3 sm:border-0 sm:p-0"
                        >
                            <div className="col-span-12 sm:col-span-5">
                                <input
                                    aria-label="Descripción"
                                    placeholder="Descripción del concepto"
                                    className={cellClass(Boolean(itemErrors?.description))}
                                    {...register(`items.${index}.description`)}
                                />
                                {itemErrors?.description && <p className="mt-1 text-xs text-red-600">{itemErrors.description.message}</p>}
                            </div>
                            <div className="col-span-4 sm:col-span-1">
                                <input
                                    aria-label="Unidad"
                                    placeholder="hora"
                                    className={cellClass(Boolean(itemErrors?.unit))}
                                    {...register(`items.${index}.unit`)}
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <input
                                    aria-label="Cantidad"
                                    type="number"
                                    step="0.01"
                                    className={`${cellClass(Boolean(itemErrors?.quantity))} text-right`}
                                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                />
                                {itemErrors?.quantity && <p className="mt-1 text-xs text-red-600">{itemErrors.quantity.message}</p>}
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <input
                                    aria-label="Precio unitario"
                                    type="number"
                                    step="0.01"
                                    className={`${cellClass(Boolean(itemErrors?.unitPrice))} text-right`}
                                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                />
                                {itemErrors?.unitPrice && <p className="mt-1 text-xs text-red-600">{itemErrors.unitPrice.message}</p>}
                            </div>
                            <div className="col-span-8 self-center text-right text-sm font-medium tabular-nums text-slate-900 sm:col-span-1">
                                {money(totals.amounts[index] ?? 0)}
                            </div>
                            <div className="col-span-4 flex items-center justify-end gap-1 sm:col-span-1">
                                <button
                                    type="button"
                                    aria-label="Subir"
                                    disabled={index === 0}
                                    onClick={() => move(index, index - 1)}
                                    className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    aria-label="Bajar"
                                    disabled={index === fields.length - 1}
                                    onClick={() => move(index, index + 1)}
                                    className="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    aria-label="Quitar"
                                    disabled={fields.length === 1}
                                    onClick={() => remove(index)}
                                    className="rounded px-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    );
                })}

                {itemsError && <ErrorAlert message={itemsError} />}

                <Button type="button" variant="secondary" onClick={() => append(emptyItem())} disabled={fields.length >= 100}>
                    + Agregar concepto
                </Button>

                <dl className="ml-auto w-full max-w-xs space-y-1 border-t border-slate-200 pt-4 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-slate-600">Subtotal</dt>
                        <dd className="tabular-nums">{money(totals.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-slate-600">IVA ({Number.isFinite(taxRate) ? taxRate : 0}%)</dt>
                        <dd className="tabular-nums">{money(totals.taxAmount)}</dd>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                        <dt>Total</dt>
                        <dd className="tabular-nums">{money(totals.total)}</dd>
                    </div>
                </dl>
            </section>

            <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <TextAreaField
                    label="Términos y condiciones"
                    placeholder="Ej. 50% de anticipo, 50% contra entrega."
                    error={errors.terms?.message}
                    {...register('terms')}
                />
                <TextAreaField label="Notas" error={errors.notes?.message} {...register('notes')} />
            </section>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => navigate(cancelTo)}>
                    Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                    {quote ? 'Guardar cambios' : 'Crear cotización'}
                </Button>
            </div>
        </form>
    );
}