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
        pais: profile.pais
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
