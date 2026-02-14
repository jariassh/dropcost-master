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
    requiresOTP: boolean;
    sessionId: string | null;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    verifyEmail: (data: VerifyEmailData) => Promise<void>;
    verify2FA: (data: TwoFactorData) => Promise<void>;
    requestPasswordReset: (data: PasswordResetRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    initialize: () => Promise<void>;
    clearError: () => void;
}
