/**
 * Store de autenticación con Zustand.
 * Gestiona estado del usuario, login, registro, 2FA y logout.
 * La lógica de negocio vive aquí, los componentes solo consumen estado.
 */
import { create } from 'zustand';
import type { AuthState, LoginCredentials, RegisterData, VerifyEmailData, TwoFactorData, PasswordResetRequest } from '@/types/auth.types';
import * as authService from '@/services/authService';

// MODO DESARROLLO: Cambiar a true para deshabilitar login obligatorio
const DEV_MODE = false;

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Empezamos en loading para checkAuth
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

            // En Supabase, si no hay 2FA configurado, el login es directo
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
            // Después de verificar email, usualmente el usuario ya está autenticado en Supabase
            const user = await authService.getCurrentUser();
            set({ isLoading: false, user, isAuthenticated: true });
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    verify2FA: async (data: TwoFactorData) => {
        set({ isLoading: true, error: null });
        try {
            // Placeholder para futura implementación de 2FA real con Supabase Factors
            set({ isLoading: false, error: '2FA no implementado en esta versión funcional' });
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
                return false;
            }
            set({ isLoading: false });
            return true;
        } catch {
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
            return false;
        }
    },

    logout: async () => {
        await authService.logoutUser();
        set({
            user: null,
            isAuthenticated: false,
            requiresOTP: false,
            sessionId: null,
            error: null,
        });
    },

    clearError: () => set({ error: null }),

    // Nueva acción para inicializar la sesión
    initialize: async () => {
        try {
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: !!user, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    }
}));
