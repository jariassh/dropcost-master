/**
 * Router principal de la aplicación.
 * Rutas de autenticación + rutas protegidas de la app.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { TwoFactorPage } from '@/pages/auth/TwoFactorPage';
import { PasswordResetPage } from '@/pages/auth/PasswordResetPage';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { SimuladorPage } from '@/pages/app/simulador/SimuladorPage';
import { MisCosteos } from '@/pages/app/simulador/MisCosteos';
import { OfertasPage } from '@/pages/app/ofertas/OfertasPage';
import { OfertaWizard } from '@/pages/app/ofertas/OfertaWizard';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminLayout } from '@/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas de autenticación */}
                <Route
                    element={
                        <PublicRoute>
                            <AuthLayout />
                        </PublicRoute>
                    }
                >
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/registro" element={<RegisterPage />} />
                    <Route path="/verificar-email" element={<VerifyEmailPage />} />
                    <Route path="/2fa" element={<TwoFactorPage />} />
                    <Route path="/recuperar-contrasena" element={<PasswordResetPage />} />
                </Route>

                {/* Rutas protegidas de la app */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/simulador" element={<SimuladorPage />} />
                    <Route path="/simulador/mis-costeos" element={<MisCosteos />} />
                    <Route path="/ofertas" element={<OfertasPage />} />
                    <Route path="/ofertas/crear" element={<OfertaWizard />} />
                    <Route path="/analisis-regional" element={<DashboardPage />} />
                    <Route path="/configuracion" element={<DashboardPage />} />
                    <Route path="/referidos" element={<DashboardPage />} />
                    <Route path="/billetera" element={<DashboardPage />} />
                </Route>

                {/* Rutas de Administración (Independientes) */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="plans" element={<AdminDashboard />} />
                    <Route path="promo-codes" element={<AdminDashboard />} />
                    <Route path="logs" element={<AdminDashboard />} />
                    <Route path="settings" element={<AdminDashboard />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
