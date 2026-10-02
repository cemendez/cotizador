import { useSyncExternalStore } from 'react';
import { slowRequests } from '../lib/slow-requests';

export function ServerWakingBanner() {
    const isSlow = useSyncExternalStore(slowRequests.subscribe, slowRequests.getSnapshot);

    // El contenedor con role="status" siempre existe: los lectores de pantalla solo anuncian
    // los cambios de contenido en una región viva que ya estaba en la página
    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
        >
            {isSlow && (
                <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
                    <span className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <p>
                        <strong className="font-medium">Despertando el servidor…</strong> Estaba inactivo y puede tardar hasta un
                        minuto. No cierres la página.
                    </p>
                </div>
            )}
        </div>
    );
}