import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { TwoFactorPage } from '@/pages/auth/TwoFactorPage';
import { PasswordResetPage } from '@/pages/auth/PasswordResetPage';
import { UpdatePasswordPage } from '@/pages/auth/UpdatePasswordPage';
import { DashboardPage } from '@/pages/app/DashboardPage';
import { SimuladorPage } from '@/pages/app/simulador/SimuladorPage';
import { MisCosteos } from '@/pages/app/simulador/MisCosteos';
import { OfertasPage } from '@/pages/app/ofertas/OfertasPage';
import { OfertaWizard } from '@/pages/app/ofertas/OfertaWizard';
import { ConfiguracionPage } from '@/pages/app/ConfiguracionPage';
import { ReferidosPage } from '@/pages/app/ReferidosPage';
import { WalletPage } from '@/pages/app/WalletPage';
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
        return <Navigate to="/simulador" replace />;
    }

    return <>{children}</>;
}

export function AppRouter() {
    return (
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

            {/* Caso especial: Actualizar contraseña usa AuthLayout pero NO PublicRoute 
                porque el enlace de recuperación crea una sesión temporal */}
            <Route element={<AuthLayout />}>
                <Route path="/actualizar-contrasena" element={<UpdatePasswordPage />} />
            </Route>

            {/* Rutas protegidas de la app */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Navigate to="/simulador" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/simulador" element={<SimuladorPage />} />
                <Route path="/simulador/mis-costeos" element={<MisCosteos />} />
                <Route path="/ofertas" element={<OfertasPage />} />
                <Route path="/analisis-regional" element={<DashboardPage />} />
                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/referidos" element={<ReferidosPage />} />
                <Route path="/billetera" element={<WalletPage />} />
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
    );
}
