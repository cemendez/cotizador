import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { TextAreaField } from '../../components/ui/TextAreaField';
import { TextField } from '../../components/ui/TextField';
import { toNullableNumber, twoDecimals } from '../../lib/validation';
import type { Service } from '../../types/api';
import { useSaveService } from './api';

const schema = z.object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
    description: z.string().trim().max(500),
    estimatedHours: z
        .number({ error: 'Número inválido' })
        .min(0.25, 'Mínimo 0.25 horas')
        .max(2000, 'Valor demasiado alto')
        .refine(twoDecimals, 'Máximo 2 decimales'),
    fixedPrice: z
        .number({ error: 'Número inválido' })
        .min(0, 'No puede ser negativo')
        .max(9_999_999_999, 'Valor demasiado alto')
        .refine(twoDecimals, 'Máximo 2 decimales')
        .nullable(),
});

type FormValues = z.infer<typeof schema>;

export function ServiceForm({ service, onDone }: { service?: Service; onDone: () => void }) {
    const save = useSaveService(service?.id);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: service?.name ?? '',
            description: service?.description ?? '',
            estimatedHours: service ? Number(service.estimatedHours) : 20,
            fixedPrice: service?.fixedPrice != null ? Number(service.fixedPrice) : null,
        },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await save.mutateAsync(values);
            onDone();
        } catch (error) {
            setError('root', { message: error instanceof Error ? error.message : 'Error inesperado' });
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-indigo-200"
        >
            {errors.root && <ErrorAlert message={errors.root.message ?? ''} />}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                    <TextField label="Nombre *" error={errors.name?.message} {...register('name')} />
                </div>
                <TextField
                    label="Horas estimadas *"
                    type="number"
                    step="0.01"
                    error={errors.estimatedHours?.message}
                    {...register('estimatedHours', { valueAsNumber: true })}
                />
                <TextField
                    label="Precio fijo (opcional)"
                    type="number"
                    step="0.01"
                    hint="Vacío = horas × tu tarifa"
                    error={errors.fixedPrice?.message}
                    {...register('fixedPrice', { setValueAs: toNullableNumber })}
                />
            </div>
            <TextAreaField label="Descripción" error={errors.description?.message} {...register('description')} />
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onDone}>
                    Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                    {service ? 'Guardar cambios' : 'Crear servicio'}
                </Button>
            </div>
        </form>
    );
}