import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { TextField } from '../../components/ui/TextField';
import { formatMoney } from '../../lib/format';
import { twoDecimals } from '../../lib/validation';
import type { PricingSettings } from '../../types/api';
import { usePricing, useSavePricing, type PricingInput } from './api';
import { calculateHourlyRate } from './rate';

const COST_FIELDS = [
    { name: 'costEquipment', label: 'Equipo', hint: 'Reparte su costo entre los meses de vida útil: laptop de $36,000 ÷ 36 meses = $1,000 al mes' },
    { name: 'costTools', label: 'Herramientas y software', hint: 'Licencias, hosting, dominios y suscripciones' },
    { name: 'costOffice', label: 'Oficina', hint: 'Renta, luz e internet (la parte que corresponde al trabajo)' },
    { name: 'costTransport', label: 'Transporte', hint: 'Traslados a clientes, gasolina, casetas' },
    { name: 'costServices', label: 'Servicios profesionales', hint: 'Contador, comisiones bancarias, seguros' },
    { name: 'costAdvertising', label: 'Publicidad', hint: 'Anuncios, tarjetas, tu propio portafolio' },
] as const;

const NUMERIC_KEYS = [
    'monthlyNetIncome',
    'costEquipment',
    'costTools',
    'costOffice',
    'costTransport',
    'costServices',
    'costAdvertising',
    'marginPercent',
    'taxReservePercent',
    'billableHoursPerMonth',
] as const;

const amount = (min: number, max: number, minMessage: string) =>
    z
        .number({ error: 'Número inválido' })
        .min(min, minMessage)
        .max(max, 'Valor demasiado alto')
        .refine(twoDecimals, 'Máximo 2 decimales');

const money = amount(0, 9_999_999_999, 'No puede ser negativo');

const schema = z.object({
    monthlyNetIncome: money,
    costEquipment: money,
    costTools: money,
    costOffice: money,
    costTransport: money,
    costServices: money,
    costAdvertising: money,
    marginPercent: amount(0, 200, 'No puede ser negativo'),
    taxReservePercent: amount(0, 90, 'Entre 0 y 90'),
    billableHoursPerMonth: amount(1, 400, 'Mínimo 1 hora'),
    hourlyRate: amount(1, 1_000_000, 'Debe ser mayor a 0'),
});

type FormValues = z.infer<typeof schema>;

const num = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

function toRateInputs(values: Partial<FormValues>) {
    return {
        monthlyNetIncome: num(values.monthlyNetIncome),
        monthlyCosts: COST_FIELDS.reduce((sum, field) => sum + num(values[field.name]), 0),
        marginPercent: num(values.marginPercent),
        taxReservePercent: num(values.taxReservePercent),
        billableHoursPerMonth: num(values.billableHoursPerMonth),
    };
}

function toFormValues(settings: PricingSettings): FormValues {
    const numbers = Object.fromEntries(NUMERIC_KEYS.map((key) => [key, Number(settings[key])])) as Omit<
        FormValues,
        'hourlyRate'
    >;
    const suggested = calculateHourlyRate(toRateInputs(numbers)).suggestedRate;
    return { ...numbers, hourlyRate: settings.hourlyRate === null ? suggested : Number(settings.hourlyRate) };
}

function Line({ label, value, strong = false }: { label: string; value: ReactNode; strong?: boolean }) {
    return (
        <div
            className={`flex justify-between gap-4 ${strong ? 'border-t border-slate-200 pt-1 font-medium text-slate-900' : 'text-slate-600'}`}
        >
            <dt>{label}</dt>
            <dd className="tabular-nums">{value}</dd>
        </div>
    );
}

function PricingForm({ settings }: { settings: PricingSettings }) {
    const savePricing = useSavePricing();
    const [saved, setSaved] = useState(false);
    const configured = settings.hourlyRate !== null;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        setError,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(settings) });

    const watched = useWatch({ control });
    const result = calculateHourlyRate(toRateInputs(watched));
    const chosenRate = num(watched.hourlyRate);
    const coverage = result.exactRate > 0 ? Math.round((chosenRate / result.exactRate) * 100) : 100;
    const fmt = (value: number) => formatMoney(value);

    const onSubmit = async (values: FormValues) => {
        setSaved(false);
        try {
            await savePricing.mutateAsync(values satisfies PricingInput);
            reset(values);
            setSaved(true);
        } catch (error) {
            setError('root', { message: error instanceof Error ? error.message : 'Error inesperado' });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                {!configured && (
                    <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                        Aún no has guardado tu configuración: los valores son de ejemplo. Reemplázalos por los tuyos.
                    </p>
                )}
                {errors.root && <ErrorAlert message={errors.root.message ?? ''} />}
                {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Tarifa guardada.</p>}

                <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                    <h2 className="font-semibold text-slate-900">Ingreso que quieres ganar</h2>
                    <TextField
                        label="Ingreso neto mensual deseado"
                        type="number"
                        step="0.01"
                        hint="Lo que quieres llevarte cada mes, ya sin costos ni impuestos"
                        error={errors.monthlyNetIncome?.message}
                        {...register('monthlyNetIncome', { valueAsNumber: true })}
                    />
                </section>

                <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                    <h2 className="font-semibold text-slate-900">Costos mensuales del negocio</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {COST_FIELDS.map((field) => (
                            <TextField
                                key={field.name}
                                label={field.label}
                                type="number"
                                step="0.01"
                                hint={field.hint}
                                error={errors[field.name]?.message}
                                {...register(field.name, { valueAsNumber: true })}
                            />
                        ))}
                    </div>
                </section>

                <section className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                    <h2 className="font-semibold text-slate-900">Margen, impuestos y horas</h2>
                    <div className="grid gap-5 sm:grid-cols-3">
                        <TextField
                            label="Margen (%)"
                            type="number"
                            step="0.01"
                            hint="Colchón para meses flojos, vacaciones y crecimiento"
                            error={errors.marginPercent?.message}
                            {...register('marginPercent', { valueAsNumber: true })}
                        />
                        <TextField
                            label="Reserva de impuestos (%)"
                            type="number"
                            step="0.01"
                            hint="Pregunta a tu contador qué porcentaje apartar según tu régimen"
                            error={errors.taxReservePercent?.message}
                            {...register('taxReservePercent', { valueAsNumber: true })}
                        />
                        <TextField
                            label="Horas facturables al mes"
                            type="number"
                            step="0.01"
                            hint="Solo las que cobras, sin contar cotizar, administrar ni soporte"
                            error={errors.billableHoursPerMonth?.message}
                            {...register('billableHoursPerMonth', { valueAsNumber: true })}
                        />
                    </div>
                </section>
            </div>

            <aside className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-slate-200 lg:sticky lg:top-6 lg:self-start">
                <h2 className="font-semibold text-slate-900">Cómo se calcula</h2>
                <dl className="space-y-1 text-sm">
                    <Line label="Ingreso neto deseado" value={fmt(result.monthlyNetIncome)} />
                    <Line label="+ Costos del negocio" value={fmt(result.monthlyCosts)} />
                    <Line label={`+ Margen (${num(watched.marginPercent)}%)`} value={fmt(result.marginAmount)} />
                    <Line label={`+ Reserva de impuestos (${num(watched.taxReservePercent)}%)`} value={fmt(result.taxAmount)} />
                    <Line label="= Ingreso bruto mensual" value={fmt(result.grossIncome)} strong />
                    <Line label="÷ Horas facturables" value={num(watched.billableHoursPerMonth)} />
                    <Line label="= Tarifa exacta por hora" value={fmt(result.exactRate)} strong />
                </dl>

                <div className="rounded-xl bg-indigo-50 p-4">
                    <p className="text-xs text-indigo-700">Tarifa sugerida (hacia arriba, a múltiplos de $10)</p>
                    <p className="text-2xl font-semibold tabular-nums text-indigo-900">{fmt(result.suggestedRate)} / h</p>
                    <Button
                        type="button"
                        variant="secondary"
                        className="mt-3 w-full"
                        onClick={() => setValue('hourlyRate', result.suggestedRate, { shouldDirty: true, shouldValidate: true })}
                    >
                        Usar la tarifa sugerida
                    </Button>
                </div>

                <TextField
                    label="Tu tarifa por hora"
                    type="number"
                    step="0.01"
                    error={errors.hourlyRate?.message}
                    {...register('hourlyRate', { valueAsNumber: true })}
                />
                {chosenRate > 0 && coverage < 100 && (
                    <p className="text-sm text-amber-700">
                        Si facturas las horas que indicaste, esta tarifa cubre el {coverage}% del ingreso que definiste.
                    </p>
                )}

                {/* Mientras no esté configurada se puede guardar sin tocar nada; después, solo si hay cambios */}
                <Button type="submit" loading={isSubmitting} disabled={configured && !isDirty} className="w-full">
                    Guardar
                </Button>
            </aside>
        </form>
    );
}

export function PricingPage() {
    const { data, isPending, isError, error } = usePricing();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">Mi tarifa por hora</h1>
                <p className="text-slate-600">
                    Calcula cuánto necesitas cobrar por hora para cubrir tu ingreso, tus costos y tus impuestos.
                </p>
            </div>
            {isPending && <p className="text-sm text-slate-500">Cargando…</p>}
            {isError && <ErrorAlert message={error.message} />}
            {data && <PricingForm settings={data} />}
        </div>
    );
}