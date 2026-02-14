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

    // 1. Intentar obtener datos adicionales del perfil en public.users
    let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    // 2. Si no existe en public.users (pero sí en Auth), creamos el perfil ahora
    // Esto previene que se queden en 'cliente' si el trigger falla o no existe.
    if (!profile && !profileError) {
        const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                nombres: user.user_metadata.nombres || '',
                apellidos: user.user_metadata.apellidos || '',
                rol: user.user_metadata.rol || 'cliente',
            })
            .select()
            .single();

        if (!createError) profile = newProfile;
    }

    return {
        id: user.id,
        email: user.email || '',
        nombres: profile?.nombres || user.user_metadata.nombres || '',
        apellidos: profile?.apellidos || user.user_metadata.apellidos || '',
        rol: profile?.rol || user.user_metadata.rol || 'cliente',
        planId: profile?.plan_id || 'plan_free',
        estadoSuscripcion: profile?.estado_suscripcion || 'activa',
        emailVerificado: !!user.email_confirmed_at,
        twoFactorEnabled: !!user.factors?.length,
        fechaRegistro: user.created_at,
    };
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    // 1. Verificar si el usuario existe en nuestra tabla pública primero
    // Esto mejora la UX al avisar si el correo no está registrado.
    const { data: userExist, error: searchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

    // Si hay un error (ej. RLS) o no hay datos, tratamos ambos casos como "No encontrado"
    // para no mostrar mensajes técnicos de "Error" al usuario.
    if (searchError || !userExist) {
        return { success: false, error: 'No se encontró ninguna cuenta vinculada a este correo electrónico o el correo es inválido.' };
    }

    // 2. Si existe, enviar el correo de recuperación
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    if (error) return { success: false, error: translateError(error.message) };
    return { success: true };
}

export async function logoutUser(): Promise<void> {
    await supabase.auth.signOut();
}
