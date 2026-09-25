import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { GuestOnly, RequireAuth } from './auth/route-guards';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const Placeholder = ({ title }: { title: string }) => (
  <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/clients" element={<Placeholder title="Clientes" />} />
            <Route path="/quotes" element={<Placeholder title="Cotizaciones" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}