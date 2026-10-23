import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { formatMoney } from '../../lib/format';
import type { Service } from '../../types/api';
import { usePricing } from '../pricing/api';
import { useDeleteService, useSeedServices, useServices } from './api';
import { servicePrice } from './price';
import { ServiceForm } from './ServiceForm';

export function ServicesPage() {
    const services = useServices();
    const pricing = usePricing();
    const seed = useSeedServices();
    const deleteService = useDeleteService();

    const [editing, setEditing] = useState<string | 'new' | null>(null);
    const [toDelete, setToDelete] = useState<Service | null>(null);

    const hourlyRate = pricing.data?.hourlyRate ? Number(pricing.data.hourlyRate) : null;

    const closeDeleteDialog = () => {
        setToDelete(null);
        deleteService.reset();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Servicios</h1>
                    <p className="text-slate-600">Tu catálogo: se agrega a las cotizaciones con un clic.</p>
                </div>
                <Button onClick={() => setEditing('new')} disabled={editing === 'new'}>
                    Nuevo servicio
                </Button>
            </div>

            {hourlyRate === null && !pricing.isPending && (
                <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                    Aún no has guardado tu tarifa, así que los servicios sin precio fijo no tienen precio.{' '}
                    <Link to="/pricing" className="font-medium underline">
                        Configurar mi tarifa
                    </Link>
                </p>
            )}

            {editing === 'new' && <ServiceForm onDone={() => setEditing(null)} />}

            {services.isPending && <p className="text-sm text-slate-500">Cargando…</p>}
            {services.isError && <ErrorAlert message={services.error.message} />}
            {seed.isError && <ErrorAlert message={seed.error.message} />}

            {services.data?.length === 0 && editing !== 'new' && (
                <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-slate-600">Aún no tienes servicios en tu catálogo.</p>
                    <Button variant="secondary" loading={seed.isPending} onClick={() => seed.mutate()}>
                        Cargar mis 4 servicios iniciales
                    </Button>
                </div>
            )}

            <ul className="space-y-3">
                {services.data?.map((service) => {
                    if (editing === service.id) {
                        return (
                            <li key={service.id}>
                                <ServiceForm service={service} onDone={() => setEditing(null)} />
                            </li>
                        );
                    }

                    const hours = Number(service.estimatedHours);
                    const price = servicePrice(service, hourlyRate);
                    const effective = service.fixedPrice !== null ? Number(service.fixedPrice) / hours : null;

                    return (
                        <li
                            key={service.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200"
                        >
                            <div className="min-w-0">
                                <p className="font-medium text-slate-900">{service.name}</p>
                                {service.description && <p className="text-sm text-slate-500">{service.description}</p>}
                                <p className="mt-1 text-sm text-slate-600">
                                    {hours} h ·{' '}
                                    {price !== null ? (
                                        <>
                                            <strong className="tabular-nums">{formatMoney(price)}</strong>{' '}
                                            {service.fixedPrice !== null ? '(precio fijo)' : '(horas × tu tarifa)'}
                                        </>
                                    ) : (
                                        'sin precio: falta tu tarifa'
                                    )}
                                    {effective !== null && hourlyRate !== null && (
                                        <span className="text-slate-500">
                                            {' '}
                                            · equivale a {formatMoney(effective)}/h ({Math.round((effective / hourlyRate) * 100)}% de tu
                                            tarifa)
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditing(service.id)}
                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                                >
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setToDelete(service)}
                                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <ConfirmDialog
                open={toDelete !== null}
                title="Eliminar servicio"
                loading={deleteService.isPending}
                error={deleteService.error?.message}
                onConfirm={() => toDelete && deleteService.mutate(toDelete.id, { onSuccess: closeDeleteDialog })}
                onClose={closeDeleteDialog}
            >
                ¿Eliminar <strong>{toDelete?.name}</strong> del catálogo? Las cotizaciones que ya lo usan no cambian.
            </ConfirmDialog>
        </div>
    );
}