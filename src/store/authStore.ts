/**
 * Store de autenticación con Zustand.
 * Gestiona estado del usuario, login, registro, 2FA y logout.
 * La lógica de negocio vive aquí, los componentes solo consumen estado.
 */
import { create } from 'zustand';
import type { AuthState, LoginCredentials, RegisterData, VerifyEmailData, TwoFactorData, PasswordResetRequest } from '@/types/auth.types';
import * as authService from '@/services/authService';

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    requiresOTP: false,
    sessionId: null,
    error: null,

    login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.loginUser(credentials);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al iniciar sesión' });
                return;
            }

            if (response.data?.requiresOTP) {
                set({
                    isLoading: false,
                    requiresOTP: true,
                    sessionId: response.data.sessionId || null,
                });
                return;
            }

            // Login directo sin 2FA
            const user = await authService.getCurrentUser();
            set({ isLoading: false, user, isAuthenticated: true });
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.registerUser(data);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al registrar' });
                return;
            }
            set({ isLoading: false });
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    verifyEmail: async (data: VerifyEmailData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.verifyEmail(data);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Código inválido' });
                return;
            }
            set({ isLoading: false });
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    verify2FA: async (data: TwoFactorData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.verify2FA(data);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Código 2FA inválido' });
                return;
            }

            // Guardar tokens
            if (response.data?.accessToken) {
                localStorage.setItem('dropcost-access-token', response.data.accessToken);
            }
            if (response.data?.refreshToken) {
                localStorage.setItem('dropcost-refresh-token', response.data.refreshToken);
            }

            const user = await authService.getCurrentUser();
            set({
                isLoading: false,
                user,
                isAuthenticated: true,
                requiresOTP: false,
                sessionId: null,
            });
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    requestPasswordReset: async (data: PasswordResetRequest) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.requestPasswordReset(data);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al enviar recuperación' });
                return;
            }
            set({ isLoading: false });
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    logout: () => {
        authService.logoutUser();
        set({
            user: null,
            isAuthenticated: false,
            requiresOTP: false,
            sessionId: null,
            error: null,
        });
    },

    clearError: () => set({ error: null }),
}));
