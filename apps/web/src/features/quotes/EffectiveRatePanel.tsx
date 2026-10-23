import { Link } from 'react-router';
import { formatMoney } from '../../lib/format';
import type { calculateEffectiveRate } from './effective-rate';

type Result = ReturnType<typeof calculateEffectiveRate>;

const TONES = {
    good: 'bg-green-50 text-green-800 ring-green-200',
    warn: 'bg-amber-50 text-amber-800 ring-amber-200',
    bad: 'bg-red-50 text-red-800 ring-red-200',
    neutral: 'bg-slate-50 text-slate-700 ring-slate-200',
};

interface Props {
    result: Result;
    hourlyRate: number | null;
    currency: string;
}

export function EffectiveRatePanel({ result, hourlyRate, currency }: Props) {
    if (result.rate === null) {
        return (
            <p className={`rounded-xl p-4 text-sm ring-1 ${TONES.neutral}`}>
                Agrega las horas estimadas de cada concepto para ver cuánto te pagaría esta cotización por hora.
            </p>
        );
    }

    const tone =
        result.coverage === null ? 'neutral' : result.coverage >= 1 ? 'good' : result.coverage >= 0.8 ? 'warn' : 'bad';

    return (
        <div className={`space-y-1 rounded-xl p-4 text-sm ring-1 ${TONES[tone]}`}>
            <p className="text-base font-semibold">
                Tarifa efectiva: {formatMoney(result.rate, currency)} / h
                {result.coverage !== null && (
                    <span className="font-normal"> · {Math.round(result.coverage * 100)}% de tu tarifa</span>
                )}
            </p>
            <p>
                {result.hours} h estimadas · {formatMoney(result.revenue, currency)} antes de IVA
                {result.itemsWithoutHours > 0 && ` · ${result.itemsWithoutHours} concepto(s) sin horas no cuentan`}
            </p>
            {result.coverage !== null && result.coverage < 1 && result.minimumPrice !== null && (
                <p>Para llegar a tu tarifa, esas horas deberían cobrarse en {formatMoney(result.minimumPrice)} (sin IVA).</p>
            )}
            {currency !== 'MXN' && <p>La comparación con tu tarifa solo aplica a cotizaciones en MXN.</p>}
            {currency === 'MXN' && hourlyRate === null && (
                <p>
                    <Link to="/pricing" className="font-medium underline">
                        Configura tu tarifa
                    </Link>{' '}
                    para compararla.
                </p>
            )}
        </div>
    );
}