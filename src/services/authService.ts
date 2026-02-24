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
    // 1. Llamar a la Edge Function de registro custom (Silencioso para Supabase)
    const response = await supabase.functions.invoke('auth-register', {
        body: {
            email: data.email,
            password: data.password,
            nombres: data.nombres,
            apellidos: data.apellidos,
            pais: data.pais,
            telefono: data.telefono,
            referred_by: data.referredBy
        }
    });

    const { data: resData, error: resError } = response;

    if (resError || !resData?.success) {
        const errorMsg = resError?.message || resData?.error || 'Error en el registro';
        console.error('[AuthService] Error en registro:', errorMsg);
        return { 
            success: false, 
            error: errorMsg
        };
    }

    // 2. Devolvemos éxito e informamos que requiere verificación
    return {
        success: true,
        data: { userId: resData.userId },
        mensaje: '¡Registro exitoso! Por favor, verifica tu correo electrónico para activar tu cuenta.'
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
             // Solo intentar si parece un UUID (evita error 400 con 'plan_free')
             const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.plan_id);
             
             if (isUUID) {
                const { data: planDataById } = await supabase
                    .from('plans')
                    .select('name, limits')
                    .eq('id', profile.plan_id)
                    .maybeSingle();
                planDetails = planDataById;
             }
        } else {
             planDetails = planData;
        }
    }

    console.log("!!! [AUTH-SERVICE] PERFIL CRUDO OBTENIDO DE TABLA 'users' !!!");
    console.log("Datos:", JSON.stringify({ 
        id_perfil: profile?.id,
        email_perfil: profile?.email,
        plan_id_perfil: profile?.plan_id,
        estado_suscripcion: profile?.estado_suscripcion,
        vencimiento: (profile as any)?.plan_expires_at
    }, null, 2));

    console.log("!!! [AUTH-SERVICE] DETALLES DEL PLAN OBTENIDOS DE TABLA 'plans' !!!");
    console.log("Plan:", JSON.stringify(planDetails, null, 2));

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
        fechaVencimiento: (profile as any)?.plan_expires_at,
        plan_precio_pagado: (profile as any)?.plan_precio_pagado || 0,
        plan_periodo: (profile as any)?.plan_periodo,
        plan: {
            id: profile?.plan_id || 'plan_free',
            slug: profile?.plan_id || 'plan_free',
            name: planDetails?.name || (
                profile?.plan_id ? (profile.plan_id.replace('plan_', '').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) : 'Plan Gratis'
            ),
            limits: (planDetails?.limits as any) || (
                profile?.plan_id === 'plan_pro' ? { stores: 5, costeos_limit: 100 } :
                profile?.plan_id === 'plan_enterprise' ? { stores: 10, costeos_limit: 500 } :
                { stores: 1 }
            )
        },
        bank_info: (profile as any)?.bank_info
    };
}

export async function requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    console.log('[authService] INICIO requestPasswordReset para:', data.email);
    
    try {
        // Obtenemos la URL y la Key de las variables de entorno para una llamada manual si es necesario
        // Pero usaremos el cliente de supabase para aprovechar la sesión si existe
        const { data: resData, error: resError } = await (supabase as any).functions.invoke('auth-password-reset', {
            body: { email: data.email }
        });

        if (resError) {
            console.error('[authService] La función de Supabase devolvió un error:', resError);
            // Intentar extraer el mensaje de error si viene en el body (a veces invoke lo pone en resError.context)
            const detailText = (resError as any).context?.statusText || resError.message;
            return { success: false, error: `Error del Servidor: ${detailText}` };
        }

        console.log('[authService] Respuesta de la función:', resData);

        if (!resData?.success) {
            console.error('[authService] Lógica de la función reportó fallo:', resData);
            return { success: false, error: resData?.error || 'No se pudo procesar la solicitud' };
        }

        console.log('[authService] ÉXITO: Instrucciones enviadas');
        return { success: true };
    } catch (err: any) {
        console.error('[authService] Error crítico ejecutando la función:', err);
        return { success: false, error: 'Error de conexión' };
    }
}

export async function updatePassword(newPassword: string): Promise<AuthResponse> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        return { success: false, error: translateError(error.message) };
    }

    // Disparar trigger CONTRASENA_CAMBIADA (fire-and-forget)
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('nombres, apellidos')
                .eq('id', user.id)
                .maybeSingle();

            dispararTriggerEmail('CONTRASENA_CAMBIADA', {
                usuario_id: user.id,
                nombres: `${profile?.nombres || ''} ${profile?.apellidos || ''}`.trim(),
                usuario_nombre: `${profile?.nombres || ''} ${profile?.apellidos || ''}`.trim(),
                usuario_email: user.email || '',
                email: user.email || '',
                fecha_actualizacion: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                login_url: `${window.location.origin}/login`,
            });
        }
    } catch (e) {
        console.warn('[authService] Error al disparar trigger de cambio de contraseña:', e);
    }

    return { success: true };
}

export async function requestEmailChange(newEmail: string): Promise<AuthResponse> {
    return invoke2FA('request_email_change', { new_email: newEmail });
}

export async function verifyEmailChange(code: string): Promise<AuthResponse> {
    return invoke2FA('verify_email_change', { code });
}

export async function updateEmail(newEmail: string): Promise<AuthResponse> {
    // This is the legacy method that used direct Supabase link confirmation.
    // We now prefer requestEmailChange + verifyEmailChange
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
    console.log(`[authService] Invocando auth-2fa | acción: ${action}`, extra);
    
    const { data, error } = await supabase.functions.invoke('auth-2fa', {
        body: { action, ...extra }
    });

    if (error) {
        console.error(`[authService] Error invocando auth-2fa (${action}):`, error);
        return { success: false, error: translateError(error.message) };
    }
    
    console.log(`[authService] Respuesta de auth-2fa (${action}):`, data);
    
    // Edge function returns standard JSON format
    return data; 
}

export async function request2FAActivation(): Promise<AuthResponse> {
    return invoke2FA('request', { context: 'activation' });
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
