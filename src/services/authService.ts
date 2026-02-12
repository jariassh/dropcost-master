/**
 * Servicio de autenticación — wrapper sobre la capa de datos.
 * Implementación placeholder que simula comportamiento async.
 * Será reemplazado por Supabase Auth en fase posterior.
 */
import type {
    LoginCredentials,
    RegisterData,
    VerifyEmailData,
    TwoFactorData,
    PasswordResetRequest,
    AuthResponse,
    User,
} from '@/types/auth.types';

// Simula latencia de red
function simulateDelay(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Usuario mock para desarrollo
const MOCK_USER: User = {
    id: 'usr_mock_001',
    email: 'demo@dropcostmaster.com',
    nombres: 'Juan',
    apellidos: 'Pérez',
    telefono: '+57 300 123 4567',
    pais: 'CO',
    planId: 'plan_pro',
    estadoSuscripcion: 'activa',
    emailVerificado: true,
    twoFactorEnabled: true,
    fechaRegistro: '2026-01-15T10:00:00Z',
    ultimaActividad: new Date().toISOString(),
};

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    await simulateDelay();

    // Simulación: cualquier email/password pasa, excepto "error@test.com"
    if (credentials.email === 'error@test.com') {
        return { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
    }

    return {
        success: true,
        data: {
            requiresOTP: true,
            sessionId: `session_${Date.now()}`,
        },
    };
}

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
    await simulateDelay(1500);

    if (data.email === 'exists@test.com') {
        return { success: false, error: 'Este correo ya está registrado.' };
    }

    return {
        success: true,
        data: { userId: `usr_${Date.now()}` },
    };
}

export async function verifyEmail(_data: VerifyEmailData): Promise<AuthResponse> {
    await simulateDelay(800);
    return { success: true };
}

export async function verify2FA(_data: TwoFactorData): Promise<AuthResponse> {
    await simulateDelay(800);

    return {
        success: true,
        data: {
            accessToken: `jwt_mock_${Date.now()}`,
            refreshToken: `refresh_mock_${Date.now()}`,
        },
    };
}

export async function requestPasswordReset(_data: PasswordResetRequest): Promise<AuthResponse> {
    await simulateDelay();
    return { success: true };
}

export async function getCurrentUser(): Promise<User | null> {
    await simulateDelay(500);
    const token = localStorage.getItem('dropcost-access-token');
    return token ? MOCK_USER : null;
}

export async function logoutUser(): Promise<void> {
    await simulateDelay(300);
    localStorage.removeItem('dropcost-access-token');
    localStorage.removeItem('dropcost-refresh-token');
}
