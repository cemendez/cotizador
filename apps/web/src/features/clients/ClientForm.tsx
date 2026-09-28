import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { TextAreaField } from '../../components/ui/TextAreaField';
import { TextField } from '../../components/ui/TextField';
import type { Client } from '../../types/api';
import { useSaveClient, type ClientInput } from './api';

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

const schema = z.object({
    name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(150),
    company: z.string().trim().max(150),
    email: z.union([z.literal(''), z.email('Correo inválido')]),
    phone: z.string().trim().max(30),
    rfc: z
        .string()
        .trim()
        .toUpperCase()
        .refine((value) => value === '' || RFC_REGEX.test(value), 'RFC con formato inválido'),
    address: z.string().trim().max(300),
    notes: z.string().trim().max(1000),
});

type FormValues = z.infer<typeof schema>;

function toFormValues(client?: Client): FormValues {
    return {
        name: client?.name ?? '',
        company: client?.company ?? '',
        email: client?.email ?? '',
        phone: client?.phone ?? '',
        rfc: client?.rfc ?? '',
        address: client?.address ?? '',
        notes: client?.notes ?? '',
    };
}

export function ClientForm({ client }: { client?: Client }) {
    const navigate = useNavigate();
    const saveClient = useSaveClient(client?.id);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: toFormValues(client),
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await saveClient.mutateAsync(values satisfies ClientInput);
            navigate('/clients');
        } catch (error) {
            setError('root', { message: error instanceof Error ? error.message : 'Error inesperado' });
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5 rounded-2xl bg-white p-6 ring-1 ring-slate-200"
        >
            {errors.root && <ErrorAlert message={errors.root.message ?? ''} />}

            <div className="gri gap-5 sm:grid-cols-2">
                <TextField label="Nombre *" error={errors.name?.message} {...register('name')} />
                <TextField label="Empresa" error={errors.company?.message} {...register('company')} />
                <TextField label="Correo" type="email" error={errors.email?.message} {...register('email')} />
                <TextField label="Teléfono" type="tel" error={errors.phone?.message} {...register('phone')} />
                <TextField
                    label="RFC"
                    className="font-mono uppercase"
                    error={errors.rfc?.message}
                    {...register('rfc')}
                />
            </div>

            <TextAreaField label="Dirección" error={errors.address?.message} {...register('address')} />
            <TextAreaField label="Notas" error={errors.notes?.message} {...register('notes')} />

            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
                    Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                    {client ? 'Guardar cambios' : "Crear cliente"}
                </Button>
            </div>

        </form>
    )
}