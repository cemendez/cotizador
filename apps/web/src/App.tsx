import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { GuestOnly, RequireAuth } from './auth/route-guards';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ClientFormPage } from './features/clients/ClientFormPage';
import { ClientsPage } from './features/clients/ClientsPage';
import { QuoteDetailPage } from './features/quotes/QuoteDetailPage';
import { QuoteFormPage } from './features/quotes/QuoteFormPage';
import { QuotesPage } from './features/quotes/QuotesPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProfilePage } from './features/profile/ProfilePage';

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

            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id/edit" element={<ClientFormPage />} />

            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/quotes/new" element={<QuoteFormPage />} />
            <Route path="/quotes/:id" element={<QuoteDetailPage />} />
            <Route path="/quotes/:id/edit" element={<QuoteFormPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}