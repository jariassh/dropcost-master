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
import { AdminPlansPage } from '@/pages/admin/AdminPlansPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminReferralPage } from '@/pages/admin/AdminReferralPage';
import { AdminWithdrawalsPage } from '@/pages/admin/AdminWithdrawalsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PricingPage } from '@/pages/PricingPage';
import { useAuthStore } from '@/store/authStore';
import UserAuditLogsPage from '@/pages/UserAuditLogsPage';
import { SubscriptionGuard } from '@/components/common/SubscriptionGuard';
import { PaymentStatusPage } from '@/pages/app/PaymentStatusPage';

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

                {/* Rutas de Planes (Públicas dentro de la App) */}
                <Route path="/pricing" element={<PricingPage />} />

                {/* Rutas con Paywall (Requieren suscripción activa) */}
                <Route path="/simulador" element={<SubscriptionGuard><SimuladorPage /></SubscriptionGuard>} />
                <Route path="/simulador/mis-costeos" element={<SubscriptionGuard><MisCosteos /></SubscriptionGuard>} />
                <Route path="/dashboard" element={<SubscriptionGuard><DashboardPage /></SubscriptionGuard>} />
                <Route path="/ofertas" element={<SubscriptionGuard><OfertasPage /></SubscriptionGuard>} />
                <Route path="/analisis-regional" element={<SubscriptionGuard><DashboardPage /></SubscriptionGuard>} />

                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/referidos" element={<SubscriptionGuard><ReferidosPage /></SubscriptionGuard>} />
                <Route path="/billetera" element={<SubscriptionGuard><WalletPage /></SubscriptionGuard>} />
                <Route path="/historial" element={<UserAuditLogsPage />} />
                <Route path="/payment/status" element={<PaymentStatusPage />} />
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
                <Route path="plans" element={<AdminPlansPage />} />
                <Route path="referrals" element={<AdminReferralPage />} />
                <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
                <Route path="promo-codes" element={<AdminDashboard />} />
                <Route path="logs" element={<AdminAuditLogsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
