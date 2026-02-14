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
    isLoading: false,
    isInitializing: true,
    requiresOTP: false,
    sessionId: null,
    error: null,

    login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.loginUser(credentials);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al iniciar sesión' });
                return false;
            }

            const user = await authService.getCurrentUser();
            set({ isLoading: false, user, isAuthenticated: true });
            return true;
        } catch (err) {
            console.error('Login error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
            return false;
        }
    },

    register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.registerUser(data);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al registrar' });
                return false;
            }
            set({ isLoading: false });
            return true;
        } catch (err) {
            console.error('Register error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
            return false;
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
            const user = await authService.getCurrentUser();
            set({ isLoading: false, user, isAuthenticated: true });
        } catch (err) {
            console.error('VerifyEmail error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    verify2FA: async (data: TwoFactorData) => {
        set({ isLoading: true, error: null });
        try {
            set({ isLoading: false, error: '2FA no implementado en esta versión funcional' });
        } catch (err) {
            console.error('Verify2FA error:', err);
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
        } catch (err) {
            console.error('Password reset error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
            return false;
        }
    },

    updatePassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.updatePassword(newPassword);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al actualizar contraseña' });
                return false;
            }
            set({ isLoading: false });
            return true;
        } catch (err) {
            console.error('Update password error:', err);
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

    initialize: async () => {
        try {
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: !!user, isInitializing: false, isLoading: false });
        } catch (err) {
            console.error('Initialization error:', err);
            set({ isInitializing: false, isLoading: false });
        }
    }
}));
