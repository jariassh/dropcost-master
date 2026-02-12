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
                    <Route path="/simulador" element={<DashboardPage />} />
                    <Route path="/analisis-regional" element={<DashboardPage />} />
                    <Route path="/configuracion" element={<DashboardPage />} />
                    <Route path="/admin" element={<DashboardPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
