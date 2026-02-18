import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/errorTranslations';
import { auditService } from './auditService';
import { dispararTriggerEmail } from '@/utils/emailTrigger';
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

    // Check if user is suspended
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('estado_suscripcion')
        .eq('id', data.user?.id)
        .maybeSingle();

    if (profile?.estado_suscripcion === 'suspendida') {
        // Sign out immediately if suspended
        await supabase.auth.signOut();
        return { 
            success: false, 
            error: 'Tu cuenta ha sido suspendida. Contacta al administrador para más información.' 
        };
    }

    // Single Session Enforcement: Generate new token
    const newSessionToken = crypto.randomUUID();
    
    // Update DB
    const { error: sessionError } = await supabase
        .from('users')
        .update({ session_token: newSessionToken } as any)
        .eq('id', data.user?.id);

    if (sessionError) {
        console.error("Error setting session token:", sessionError);
        // We log but don't block login
    } else {
        localStorage.setItem('dc_session_token', newSessionToken);
        
        // Registrar actividad de login (esto actualizará ultima_actividad y capturará IP)
        await auditService.recordLog({
            accion: 'LOGIN',
            entidad: 'USER',
            entidadId: data.user?.id,
            detalles: { method: 'email', success: true }
        });
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
                referred_by: data.referredBy,
                rol: 'cliente',
            }
        }
    });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    // Initialize session token for new user if auto-login happens
    if (authData.user) {
         const newSessionToken = crypto.randomUUID();
         if (authData.session) {
             const { error: updateError } = await supabase
                .from('users')
                .update({ session_token: newSessionToken } as any)
                .eq('id', authData.user.id);
             
             if (!updateError) {
                localStorage.setItem('dc_session_token', newSessionToken);
             }
         }

         // Disparar trigger USUARIO_REGISTRADO (fire-and-forget)
         dispararTriggerEmail('USUARIO_REGISTRADO', {
             usuario_id: authData.user.id,
             usuario_nombre: `${data.nombres} ${data.apellidos}`.trim(),
             usuario_email: data.email,
             fecha_registro: new Date().toISOString().split('T')[0],
             codigo_referido: data.referredBy || '',
         });

         // Si se registró con código de referido, disparar REFERIDO_REGISTRADO
         if (data.referredBy) {
             dispararTriggerEmail('REFERIDO_REGISTRADO', {
                 usuario_id: authData.user.id,
                 usuario_nombre: `${data.nombres} ${data.apellidos}`.trim(),
                 usuario_email: data.email,
                 codigo_referido: data.referredBy,
                 fecha_registro: new Date().toISOString().split('T')[0],
             });
         }
    }

    return {
        success: true,
        data: { userId: authData.user?.id },
    };
}

// Restored Functions

export async function verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    // Usually handled by link, but if code is provided:
    // Requires email which we might not have if only userId is passed.
    // Assuming this might be used in a flow where we know the email or checks session.
    // For now, returning success false as placeholder if not implemented properly in original.
    // Most auth flows use link clicking which Supabase handles globally.
    return { success: false, error: "Verificación por código no soportada en este método." };
}

export async function getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        return null;
    }

    // Get public profile with plan details
    // 1. Intentar obtener el perfil SIN el join problemático primero
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
        console.error("Error fetching user profile (Retry without join):", profileError);
    }

    // 2. Si tenemos perfil y plan_id, buscamos los detalles del plan por separado
    let planDetails = null;
    if (profile?.plan_id) {
        const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('name, limits')
            .eq('slug', profile.plan_id)
            .maybeSingle();
        
        // Si falla por slug, intentamos por id (backup strategy)
        if (planError || !planData) {
             const { data: planDataById } = await supabase
                .from('plans')
                .select('name, limits')
                .eq('id', profile.plan_id)
                .maybeSingle();
             planDetails = planDataById;
        } else {
             planDetails = planData;
        }
    }

    return {
        id: user.id,
        email: user.email!,
        nombres: profile?.nombres || (user.user_metadata?.nombres as string) || '',
        apellidos: profile?.apellidos || (user.user_metadata?.apellidos as string) || '',
        telefono: profile?.telefono || (user.user_metadata?.telefono as string),
        pais: profile?.pais || (user.user_metadata?.pais as string),
        rol: (profile?.rol || user.user_metadata?.rol || 'cliente') as any,
        estadoSuscripcion: (profile?.estado_suscripcion || 'pendiente') as any,
        emailVerificado: !!user.email_confirmed_at,
        twoFactorEnabled: profile?.['2fa_habilitado'] || false,
        fechaRegistro: user.created_at,
        codigoReferido: profile?.codigo_referido_personal || undefined,
        planId: profile?.plan_id || 'plan_free',
        plan: planDetails ? {
            name: planDetails.name,
            limits: planDetails.limits as any
        } : undefined,
        bank_info: (profile as any)?.bank_info
    };
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    return { success: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResponse> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    return { success: true };
}

export async function updateEmail(newEmail: string): Promise<AuthResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    const previousEmail = user?.email || '';

    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    // Disparar trigger EMAIL_CAMBIADO (fire-and-forget)
    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('nombres, apellidos')
            .eq('id', user.id)
            .maybeSingle();

        dispararTriggerEmail('EMAIL_CAMBIADO', {
            usuario_id: user.id,
            usuario_nombre: `${profile?.nombres || ''} ${profile?.apellidos || ''}`.trim(),
            email_nuevo: newEmail,
            email_anterior: previousEmail,
            fecha_cambio: new Date().toISOString().split('T')[0],
        });
    }

    return { success: true };
}

/**
 * Reenvía el email de verificación a un usuario.
 */
export async function resendVerificationEmail(email: string): Promise<AuthResponse> {
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
    });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    return { success: true };
}

// 2FA Functions using Edge Function

async function invoke2FA(action: string, extra: any = {}): Promise<AuthResponse> {
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action, ...extra }
    });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }
    
    // Edge function returns standard JSON format
    return data; 
}

export async function request2FAActivation(): Promise<AuthResponse> {
    return invoke2FA('request');
}

export async function confirm2FAActivation(code: string): Promise<AuthResponse> {
    return invoke2FA('verify', { code });
}

export async function request2FALogin(): Promise<AuthResponse> {
    // Reuses request logic (sends code to email)
    return invoke2FA('request'); 
}

export async function verify2FALogin(code: string): Promise<AuthResponse> {
    return invoke2FA('verify_login', { code });
}

export async function disable2FA(): Promise<AuthResponse> {
    return invoke2FA('disable');
}

export async function logoutUser(): Promise<void> {
    localStorage.removeItem('dc_session_token');
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
    const updates: any = {
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        telefono: userData.telefono,
        pais: userData.pais,
        codigo_referido_personal: userData.codigoReferido
    };

    const { error: profileError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

    if (profileError) return { success: false, error: translateError(profileError.message) };

    // Disparar trigger PERFIL_ACTUALIZADO (fire-and-forget)
    dispararTriggerEmail('PERFIL_ACTUALIZADO', {
        usuario_id: user.id,
        usuario_nombre: `${userData.nombres || ''} ${userData.apellidos || ''}`.trim(),
        usuario_email: user.email || '',
        fecha_actualizacion: new Date().toISOString().split('T')[0],
    });

    return { success: true };
}
