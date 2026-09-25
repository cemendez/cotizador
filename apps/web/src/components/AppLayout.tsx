import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/auth-context';
import { Button } from './ui/Button'

const links = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/clients', label: 'Clientes', end: false },
    { to: '/quotes', label: 'Cotizaciones', end: false },
];

export function AppLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b borer-sate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                    <nav className="flex items-center gap-1">
                        <span className="mr-4 font-semibold text-indigo-600">Cotizador</span>
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) =>
                                    `roundedd-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-slate-600 sm:inline">{user?.name}</span>
                        <Button variant="secondary" onClick={logout}>
                            Salir
                        </Button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}