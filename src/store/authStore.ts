/**
 * Store de autenticación con Zustand.
 * Gestiona estado del usuario, login, registro, 2FA y logout.
 * La lógica de negocio vive aquí, los componentes solo consumen estado.
 */
import { create } from 'zustand';
import type { AuthState, LoginCredentials, RegisterData, VerifyEmailData, TwoFactorData, PasswordResetRequest, User } from '@/types/auth.types';
import * as authService from '@/services/authService';
import { auditService } from '@/services/auditService';

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
            
            // Check 2FA
            if (user?.twoFactorEnabled) {
                // Invalidate old token to prevent bypass on refresh/back
                localStorage.removeItem(`2fa_verified_${user.id}`);

                // Solicitar código
                const faResponse = await authService.request2FALogin();
                
                if (!faResponse.success) {
                    set({ isLoading: false, error: 'Error al enviar código 2FA: ' + faResponse.error });
                    return false;
                }

                set({ 
                    isLoading: false, 
                    user, // Usuario cargado pero no autenticado
                    isAuthenticated: false,
                    requiresOTP: true,
                    sessionId: user.id 
                });
                return true;
            }

            set({ isLoading: false, user, isAuthenticated: true });
            
            // Log Auditoría: Login Exitoso
            auditService.recordLog({
                accion: 'LOGIN',
                entidad: 'USER',
                entidadId: user?.id,
                detalles: { email: credentials.email }
            });

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
            // Verificar código
            const response = await authService.verify2FALogin(data.code);
            
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Código inválido' });
                return;
            }

            // Éxito - Persistir validación 2FA (30 días)
            const user = await authService.getCurrentUser();
            if (user) {
                localStorage.setItem(`2fa_verified_${user.id}`, Date.now().toString());
            }

            set({ 
                isLoading: false, 
                user,
                isAuthenticated: true, 
                requiresOTP: false,
                sessionId: null
            });

            // Log Auditoría: Login 2FA Exitoso
            auditService.recordLog({
                accion: 'LOGIN',
                entidad: 'USER',
                entidadId: user?.id,
                detalles: { method: '2FA' }
            });

        } catch (err) {
            console.error('Verify2FA error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
        }
    },

    resend2FACode: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.request2FALogin();
            if (!response.success) {
                set({ isLoading: false, error: 'Error al reenviar código: ' + response.error });
                return false;
            }
            set({ isLoading: false });
            return true;
        } catch (err) {
            set({ isLoading: false, error: 'Error al reenviar código' });
            return false;
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

    updateEmail: async (newEmail: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.updateEmail(newEmail);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al actualizar email' });
                return false;
            }
            set({ isLoading: false });
            return true;
        } catch (err) {
            console.error('Update email error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
            return false;
        }
    },

    requestEmailChange: async (newEmail: string) => {
        // console.log('[authStore] Solicitando cambio de email a:', newEmail);
        set({ isLoading: true, error: null });
        try {
            const response = await authService.requestEmailChange(newEmail);
            // console.log('[authStore] Respuesta solicitud email change:', response);
            
            if (!response.success) {
                const errorMsg = response.error || 'Error al solicitar cambio de email';
                set({ isLoading: false, error: errorMsg });
                return { success: false, error: errorMsg };
            }
            set({ isLoading: false });
            return { success: true };
        } catch (err) {
            console.error('[authStore] Error en requestEmailChange:', err);
            const errorMsg = 'Error al solicitar cambio de email';
            set({ isLoading: false, error: errorMsg });
            return { success: false, error: errorMsg };
        }
    },

    verifyEmailChange: async (code: string) => {
        // console.log('[authStore] Verificando código de cambio de email:', code);
        set({ isLoading: true, error: null });
        try {
            const response = await authService.verifyEmailChange(code);
            // console.log('[authStore] Respuesta verificación email change:', response);
            
            if (!response.success) {
                set({ isLoading: false, error: response.error });
                return false;
            }
            const user = await authService.getCurrentUser();
            set({ isLoading: false, user });
            return true;
        } catch (err) {
            console.error('[authStore] Error en verifyEmailChange:', err);
            set({ isLoading: false, error: 'Error al verificar cambio de email' });
            return false;
        }
    },

    updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.updateUserProfile(userData);
            if (!response.success) {
                set({ isLoading: false, error: response.error || 'Error al actualizar perfil' });
                return false;
            }

            // Refrescar datos locales del usuario
            const user = await authService.getCurrentUser();
            set({ isLoading: false, user });

            // Log Auditoría: Perfil Actualizado
            auditService.recordLog({
                accion: 'UPDATE_PROFILE',
                entidad: 'USER',
                entidadId: user?.id,
                detalles: userData
            });

            return true;
        } catch (err) {
            console.error('Update profile error:', err);
            set({ isLoading: false, error: 'Error de conexión. Intenta de nuevo.' });
            return false;
        }
    },

    request2FA: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.request2FAActivation();
            if (!response.success) {
                const errorMsg = response.error || 'Error al solicitar 2FA';
                set({ isLoading: false, error: errorMsg });
                return { success: false, error: errorMsg };
            }
            set({ isLoading: false });
            return { success: true };
        } catch (err) {
            const errorMsg = 'Error al solicitar 2FA';
            set({ isLoading: false, error: errorMsg });
            return { success: false, error: errorMsg };
        }
    },

    confirm2FA: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.confirm2FAActivation(code);
            if (!response.success) {
                set({ isLoading: false, error: response.error });
                return false;
            }
            const user = await authService.getCurrentUser();
            set({ isLoading: false, user });
            return true;
        } catch (err) {
            set({ isLoading: false, error: 'Error al confirmar 2FA' });
            return false;
        }
    },

    disable2FA: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await authService.disable2FA();
            if (response.success) {
                const user = await authService.getCurrentUser();
                set({ user });
            }
            set({ isLoading: false });
            return response.success;
        } catch (err) {
            set({ isLoading: false, error: 'Error al desactivar 2FA' });
            return false;
        }
    },

    logout: async () => {
        await authService.logoutUser();
        // Limpiar persistencia de 2FA al hacer logout explícito
        const user = useAuthStore.getState().user;
        if (user) {
            localStorage.removeItem(`2fa_verified_${user.id}`);
        }

        // Log Auditoría: Logout
        if (user) {
            auditService.recordLog({
                accion: 'LOGOUT',
                entidad: 'USER',
                entidadId: user?.id,
                detalles: {}
            });
        }

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
            
            if (!user) {
                set({ user: null, isAuthenticated: false, isInitializing: false, isLoading: false });
                return;
            }

            let isAuthenticated = true;
            let requiresOTP = false;

            // Verificar persistencia 2FA
            if (user.twoFactorEnabled) {
                const storageKey = `2fa_verified_${user.id}`;
                const verifiedAt = localStorage.getItem(storageKey);
                // 30 días de validez
                const isValid = verifiedAt && (Date.now() - parseInt(verifiedAt) < 30 * 24 * 60 * 60 * 1000); 
                
                if (!isValid) {
                    isAuthenticated = false;
                    requiresOTP = true;
                }
            }

            set({ user, isAuthenticated, requiresOTP, isInitializing: false, isLoading: false });
        } catch (err) {
            console.error('Initialization error:', err);
            set({ isInitializing: false, isLoading: false });
        }
    }
}));
