import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useDebounceValue } from '../../lib/use-debounced-value';
import type { Client } from '../../types/api';
import { useClient, useClientSearch } from './api';

const clientLabel = (client: Pick<Client, 'name' | 'company'>) =>
    client.company ? `${client.company} (${client.name})` : client.name;

interface Props {
    label: string;
    value: string; // id del cliente seleccionado ('' si no hay)
    onChange: (clientId: string) => void;
    onBlur?: () => void;
    error?: string;
}

export function ClientCombobox({ label, value, onChange, onBlur, error }: Props) {
    const baseId = useId();
    const inputId = `${baseId}-input`;
    const listId = `${baseId}-list`;
    const errorId = `${baseId}-error`;
    const selectedId = `${baseId}-selected`;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(''); // lo que el usuario escribe; nunca contiene el cliente elegido
    const [activeIndex, setActiveIndex] = useState(0);
    const [picked, setPicked] = useState<Client | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const search = useDebounceValue(query.trim(), 300);
    const results = useClientSearch(search, open);
    const clients = results.data?.data ?? [];
    const total = results.data?.meta.total ?? 0;
    const activeOption = clients.length > 0 ? Math.min(activeIndex, clients.length - 1) : -1;

    // Nombre del cliente elegido: el que acaba de seleccionarse o, al editar, el que trae el servidor
    const needsFetch = value !== '' && picked?.id !== value;
    const fetched = useClient(needsFetch ? value : undefined);
    const selectedClient = picked?.id === value ? picked : fetched.data;
    const selectedLabel = selectedClient ? clientLabel(selectedClient) : '';

    // Mantiene visible la opción activa al navegar con el teclado
    useEffect(() => {
        if (!open || activeOption < 0) return;
        (listRef.current?.children[activeOption] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    }, [open, activeOption]);

    const closeList = () => {
        setOpen(false);
        setQuery('');
        setActiveIndex(0);
    };

    const select = (client: Client) => {
        setPicked(client);
        onChange(client.id);
        closeList();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!open) setOpen(true);
                else setActiveIndex(Math.min(activeOption + 1, clients.length - 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (open) setActiveIndex(Math.max(activeOption - 1, 0));
                break;
            case 'Enter':
                event.preventDefault(); // desde aquí nunca se envía el formulario
                if (open && activeOption >= 0) select(clients[activeOption]);
                else setOpen(true);
                break;
            case 'Escape':
                if (open) {
                    event.preventDefault();
                    closeList();
                }
                break;
        }
    };

    const statusText =
        results.isPending || results.isPlaceholderData
            ? 'Buscando…'
            : clients.length === 0
                ? search
                    ? `Sin resultados para "${search}".`
                    : 'Aún no tienes clientes registrados.'
                : total > clients.length
                    ? `Mostrando ${clients.length} de ${total}. Escribe para filtrar.`
                    : `${total} ${total === 1 ? 'cliente' : 'clientes'}.`;

    const describedBy = [selectedLabel && selectedId, error && errorId].filter(Boolean).join(' ');

    return (
        <div className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                {label}
            </label>

            <div className="relative">
                <input
                    id={inputId}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={open && clients.length > 0 ? listId : undefined}
                    aria-autocomplete="list"
                    aria-activedescendant={open && activeOption >= 0 ? `${baseId}-option-${activeOption}` : undefined}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy || undefined}
                    autoComplete="off"
                    value={query}
                    placeholder={selectedLabel || 'Busca por nombre, empresa, correo o RFC'}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(0);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        closeList();
                        onBlur?.();
                    }}
                    className={`w-full rounded-lg border px-3 py-2 pr-8 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${selectedLabel ? 'placeholder:text-slate-900' : 'placeholder:text-slate-400'
                        } ${error ? 'border-red-500' : 'border-slate-300'}`}
                />
                <span aria-hidden className="pointer-events-none absolute right-3 top-2.5 text-slate-400">
                    ▾
                </span>

                {open && (
                    // preventDefault en mousedown: hacer clic en la lista (o en su barra de desplazamiento) no quita el foco al campo
                    <div
                        onMouseDown={(event) => event.preventDefault()}
                        className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
                    >
                        {clients.length > 0 && (
                            <ul ref={listRef} id={listId} role="listbox" aria-label="Clientes" className="max-h-60 overflow-auto py-1">
                                {clients.map((client, index) => {
                                    const detail = [client.company ? client.name : null, client.email, client.rfc]
                                        .filter(Boolean)
                                        .join(' · ');
                                    return (
                                        <li
                                            key={client.id}
                                            id={`${baseId}-option-${index}`}
                                            role="option"
                                            aria-selected={client.id === value}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => select(client)}
                                            className={`cursor-pointer px-3 py-2 ${index === activeOption ? 'bg-indigo-50' : ''}`}
                                        >
                                            <p className="text-sm font-medium text-slate-900">{client.company ?? client.name}</p>
                                            {detail && <p className="text-xs text-slate-500">{detail}</p>}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">{statusText}</p>
                    </div>
                )}
            </div>

            {selectedLabel && (
                <span id={selectedId} className="sr-only">
                    Cliente seleccionado: {selectedLabel}
                </span>
            )}
            {/* Región viva siempre presente: los lectores de pantalla anuncian los cambios en el estado de la búsqueda */}
            <span role="status" className="sr-only">
                {open ? statusText : ''}
            </span>
            {error && (
                <p id={errorId} className="text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}