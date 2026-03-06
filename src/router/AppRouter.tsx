import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LandingLayout } from '@/layouts/LandingLayout';
import { Spinner } from '@/components/common/Spinner';
import { SubscriptionGuard } from '@/components/common/SubscriptionGuard';
import { AffiliateTracker } from '@/components/common/AffiliateTracker';

// Lazy loading de páginas para mejor performance
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SimuladorPage = lazy(() => import('@/pages/app/simulador/SimuladorPage').then(m => ({ default: m.SimuladorPage })));
const MisCosteos = lazy(() => import('@/pages/app/simulador/MisCosteos').then(m => ({ default: m.MisCosteos })));
const ReferidosPage = lazy(() => import('@/pages/app/ReferidosPage').then(m => ({ default: m.ReferidosPage })));
const WalletPage = lazy(() => import('@/pages/app/WalletPage').then(m => ({ default: m.WalletPage })));
const SincronizarPage = lazy(() => import('@/pages/app/SincronizarPage').then(m => ({ default: m.SincronizarPage })));
const OfertasPage = lazy(() => import('@/pages/app/ofertas/OfertasPage').then(m => ({ default: m.OfertasPage })));
const ContactosPage = lazy(() => import('@/pages/app/ContactosPage').then(m => ({ default: m.ContactosPage })));
const LaunchpadPage = lazy(() => import('@/pages/app/LaunchpadPage').then(m => ({ default: m.LaunchpadPage })));

// Configuración
const ConfiguracionPage = lazy(() => import('@/pages/app/ConfiguracionPage').then(m => ({ default: m.ConfiguracionPage })));
const PerfilPage = lazy(() => import('@/pages/app/configuracion/PerfilPage').then(m => ({ default: m.PerfilPage })));
const SeguridadPage = lazy(() => import('@/pages/app/configuracion/SeguridadPage').then(m => ({ default: m.SeguridadPage })));
const IntegracionesPage = lazy(() => import('@/pages/app/configuracion/IntegracionesPage').then(m => ({ default: m.IntegracionesPage })));
const TiendasPage = lazy(() => import('@/pages/app/configuracion/TiendasPage').then(m => ({ default: m.TiendasPage })));
const StoreManagementPage = lazy(() => import('@/pages/app/StoreManagementPage').then(m => ({ default: m.StoreManagementPage })));

// Autenticación
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const TwoFactorPage = lazy(() => import('@/pages/auth/TwoFactorPage').then(m => ({ default: m.TwoFactorPage })));
const PasswordResetPage = lazy(() => import('@/pages/auth/PasswordResetPage').then(m => ({ default: m.PasswordResetPage })));
const UpdatePasswordPage = lazy(() => import('@/pages/auth/UpdatePasswordPage').then(m => ({ default: m.UpdatePasswordPage })));

// Callbacks & Feedback
const PaymentStatusPage = lazy(() => import('@/pages/app/PaymentStatusPage').then(m => ({ default: m.PaymentStatusPage })));
const MetaCallbackPage = lazy(() => import('@/pages/auth/MetaCallbackPage').then(m => ({ default: m.MetaCallbackPage })));
const UserAuditLogsPage = lazy(() => import('@/pages/UserAuditLogsPage'));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminPlansPage = lazy(() => import('@/pages/admin/AdminPlansPage').then(m => ({ default: m.AdminPlansPage })));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })));
const AdminReferralPage = lazy(() => import('@/pages/admin/AdminReferralPage').then(m => ({ default: m.AdminReferralPage })));
const AdminWithdrawalsPage = lazy(() => import('@/pages/admin/AdminWithdrawalsPage').then(m => ({ default: m.AdminWithdrawalsPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const MarketingDashboardPage = lazy(() => import('@/pages/admin/marketing/MarketingDashboardPage'));
const SegmentBuilderPage = lazy(() => import('@/pages/admin/marketing/SegmentBuilderPage'));
const CampaignWizardPage = lazy(() => import('@/pages/admin/marketing/CampaignWizardPage'));

// Otras páginas
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const TerminosPage = lazy(() => import('@/pages/legal/TerminosPage').then(m => ({ default: m.TerminosPage })));
const PrivacidadPage = lazy(() => import('@/pages/legal/PrivacidadPage').then(m => ({ default: m.PrivacidadPage })));
const CookiesPage = lazy(() => import('@/pages/legal/CookiesPage').then(m => ({ default: m.CookiesPage })));

function ChargingPage() {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <Spinner size="lg" />
        </div>
    );
}

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
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export function AppRouter() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return (
        <>
            <AffiliateTracker />
            <Suspense fallback={<ChargingPage />}>
                <Routes>
                    {/* Landing Page Route - Redirección inmediata si está autenticado para evitar flash de Layout */}
                    <Route path="/" element={
                        isAuthenticated ? <Navigate to="/dashboard" replace /> : (
                            <LandingLayout>
                                <LandingPage />
                            </LandingLayout>
                        )
                    } />

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
                        {/* Rutas de Planes (Públicas dentro de la App) */}
                        <Route path="/pricing" element={<PricingPage />} />

                        {/* Launchpad (Onboarding) */}
                        <Route path="/launchpad" element={<LaunchpadPage />} />

                        {/* Rutas con Paywall (Requieren suscripción activa) */}
                        <Route path="/mis-costeos" element={<SubscriptionGuard><MisCosteos /></SubscriptionGuard>} />
                        <Route path="/mis-costeos/:id" element={<SubscriptionGuard><SimuladorPage /></SubscriptionGuard>} />
                        <Route path="/dashboard" element={<SubscriptionGuard><DashboardPage /></SubscriptionGuard>} />
                        <Route path="/ofertas" element={<SubscriptionGuard><OfertasPage /></SubscriptionGuard>} />
                        <Route path="/analisis-regional" element={<SubscriptionGuard><DashboardPage /></SubscriptionGuard>} />
                        <Route path="/sincronizar" element={<SubscriptionGuard><SincronizarPage /></SubscriptionGuard>} />
                        <Route path="/contactos" element={<SubscriptionGuard><ContactosPage /></SubscriptionGuard>} />

                        <Route path="/configuracion" element={<ConfiguracionPage />}>
                            <Route path="perfil" element={<PerfilPage />} />
                            <Route path="seguridad" element={<SeguridadPage />} />
                            <Route path="integraciones" element={<IntegracionesPage />} />
                            <Route path="tiendas" element={<TiendasPage />} />
                        </Route>
                        <Route path="/referidos" element={<SubscriptionGuard><ReferidosPage /></SubscriptionGuard>} />
                        <Route path="/billetera" element={<SubscriptionGuard><WalletPage /></SubscriptionGuard>} />
                        <Route path="/configuracion/tiendas/:id" element={<SubscriptionGuard><StoreManagementPage /></SubscriptionGuard>} />
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
                        <Route path="marketing" element={<MarketingDashboardPage />} />
                        <Route path="marketing/new-list" element={<SegmentBuilderPage />} />
                        <Route path="marketing/list/:id" element={<SegmentBuilderPage />} />
                        <Route path="marketing/new-campaign" element={<CampaignWizardPage />} />
                    </Route>

                    {/* Rutas Públicas (sin layout, accesibles por cualquier persona) */}
                    <Route path="/terminos" element={<TerminosPage />} />
                    <Route path="/privacidad" element={<PrivacidadPage />} />
                    <Route path="/cookies" element={<CookiesPage />} />
                    <Route path="/api/auth/meta/callback" element={<MetaCallbackPage />} />

                    <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
                </Routes>
            </Suspense>
        </>
    );
}
