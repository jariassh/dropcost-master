/** Tipos para el módulo de autenticación */

export interface User {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    pais?: string;
    planId?: string;
    estadoSuscripcion?: 'activa' | 'cancelada' | 'suspendida';
    emailVerificado: boolean;
    twoFactorEnabled: boolean;
    rol?: 'cliente' | 'admin' | 'superadmin';
    fechaRegistro: string;
    ultimaActividad?: string;
    codigoReferido?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    pais: string;
    referredBy?: string; // ID o Código del usuario que refiere
    acceptTerms: boolean;
}

export interface VerifyEmailData {
    code: string;
    userId: string;
}

export interface TwoFactorData {
    code: string;
    sessionId: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface AuthResponse {
    success: boolean;
    data?: {
        userId?: string;
        accessToken?: string;
        refreshToken?: string;
        requiresOTP?: boolean;
        sessionId?: string;
    };
    error?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    requiresOTP: boolean;
    sessionId: string | null;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<boolean>;
    register: (data: RegisterData) => Promise<boolean>;
    verifyEmail: (data: VerifyEmailData) => Promise<void>;
    verify2FA: (data: TwoFactorData) => Promise<void>;
    requestPasswordReset: (data: PasswordResetRequest) => Promise<boolean>;
    updatePassword: (newPassword: string) => Promise<boolean>;
    updateEmail: (newEmail: string) => Promise<boolean>;
    updateProfile: (userData: Partial<User>) => Promise<boolean>;
    request2FA: () => Promise<{ success: boolean; error?: string }>;
    resend2FACode: () => Promise<boolean>;
    confirm2FA: (code: string) => Promise<boolean>;
    disable2FA: () => Promise<boolean>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
    clearError: () => void;
}
