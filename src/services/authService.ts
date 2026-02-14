import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/errorTranslations';
import type {
    LoginCredentials,
    RegisterData,
    VerifyEmailData,
    TwoFactorData,
    PasswordResetRequest,
    AuthResponse,
    User,
} from '@/types/auth.types';

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
    });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    return {
        success: true,
        data: {
            userId: data.user?.id,
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
        },
    };
}

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                nombres: data.nombres,
                apellidos: data.apellidos,
                pais: data.pais,
                telefono: data.telefono,
                rol: 'cliente', // Por defecto
            }
        }
    });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    return {
        success: true,
        data: { userId: authData.user?.id },
    };
}

export async function verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    // Supabase maneja la verificación via links, 
    // pero si usamos códigos OTP para email:
    const { error } = await supabase.auth.verifyOtp({
        token: data.code,
        type: 'email',
        email: '', // Necesitaríamos el email o usaría el del flujo actual
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: true };
}

export async function getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    // 1. Obtener datos actuales del perfil en public.users
    let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    const lastActivity = new Date().toISOString();
    const isEmailVerified = !!user.email_confirmed_at;

    // 2. Si no existe, lo creamos con toda la metadata disponible
    if (!profile && !profileError) {
        const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                nombres: user.user_metadata.nombres || '',
                apellidos: user.user_metadata.apellidos || '',
                rol: user.user_metadata.rol || (user.email === 'jariash.freelancer@gmail.com' ? 'superadmin' : 'cliente'),
                telefono: user.user_metadata.telefono || null,
                pais: user.user_metadata.pais || null,
                email_verificado: isEmailVerified,
                ultima_actividad: lastActivity
            })
            .select()
            .single();

        if (createError) {
            console.error('Error al crear perfil en public.users:', createError);
        } else {
            profile = newProfile;
        }
    } else if (profile) {
        // 3. Si existe, actualizamos actividad y email_verificado si es necesario
        const updates: any = { ultima_actividad: lastActivity };

        if (profile.email_verificado !== isEmailVerified) {
            updates.email_verificado = isEmailVerified;
        }

        // Backfill de datos si faltan en public.users pero están en Auth metadata
        if (!profile.telefono && user.user_metadata.telefono) updates.telefono = user.user_metadata.telefono;
        if (!profile.pais && user.user_metadata.pais) updates.pais = user.user_metadata.pais;

        const { data: updatedProfile } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (updatedProfile) profile = updatedProfile;
    }

    if (!profile) return null;

    return {
        id: user.id,
        email: user.email || '',
        nombres: profile.nombres || '',
        apellidos: profile.apellidos || '',
        rol: profile.rol === 'superadmin' || user.email === 'jariash.freelancer@gmail.com' ? 'superadmin' : profile.rol,
        planId: profile.plan_id || 'plan_free',
        estadoSuscripcion: profile.estado_suscripcion || 'activa',
        emailVerificado: !!profile.email_verificado,
        twoFactorEnabled: !!profile["2fa_habilitado"],
        fechaRegistro: profile.fecha_registro,
        ultimaActividad: profile.ultima_actividad,
        telefono: profile.telefono,
        pais: profile.pais,
        codigoReferido: profile.codigo_referido_personal
    };
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResponse> {
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: true };
}

/**
 * Solicita el cambio de email. Envía verificación al nuevo correo.
 */
export async function updateEmail(newEmail: string): Promise<AuthResponse> {
    const { error } = await supabase.auth.updateUser({
        email: newEmail
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: true };
}

/**
 * Solicita activación de 2FA. Envía código al email actual vía Edge Function.
 */
export async function request2FAActivation(): Promise<AuthResponse> {
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action: 'request' }
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: data.success, error: data.error };
}

/**
 * Confirma y activa el 2FA vía Edge Function.
 */
export async function confirm2FAActivation(code: string): Promise<AuthResponse> {
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action: 'verify', code }
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: data.success, error: data.error };
}

/**
 * Solicita código 2FA para LOGIN (reusa la acción 'request').
 */
export async function request2FALogin(): Promise<AuthResponse> {
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action: 'request' }
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: data.success, error: data.error };
}

/**
 * Verifica código 2FA para LOGIN (acción 'verify_login').
 */
export async function verify2FALogin(code: string): Promise<AuthResponse> {
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action: 'verify_login', code }
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: data.success, error: data.error };
}

/**
 * Desactiva el 2FA vía Edge Function.
 */
export async function disable2FA(): Promise<AuthResponse> {
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action: 'disable' }
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: data.success, error: data.error };
}

export async function logoutUser(): Promise<void> {
    await supabase.auth.signOut();
}

/**
 * Actualiza el perfil del usuario (metadatos y tabla public.users).
 */
export async function updateUserProfile(userData: Partial<User>): Promise<AuthResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sesión no encontrada' };

    // 1. Actualizar metadata de Auth
    const { error: authError } = await supabase.auth.updateUser({
        data: {
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            telefono: userData.telefono,
            pais: userData.pais
        }
    });

    if (authError) return { success: false, error: translateError(authError.message) };

    // 2. Actualizar tabla public.users
    const { error: profileError } = await supabase
        .from('users')
        .update({
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            telefono: userData.telefono,
            pais: userData.pais,
            codigo_referido_personal: userData.codigoReferido
        })
        .eq('id', user.id);

    if (profileError) return { success: false, error: translateError(profileError.message) };

    return { success: true };
}
