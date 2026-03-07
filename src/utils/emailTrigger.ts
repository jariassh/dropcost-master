import { supabase } from '@/lib/supabase';

/**
 * Helper para disparar triggers de email desde el frontend.
 * Llama a la Edge Function email-trigger-dispatcher.
 * Los errores se loguean pero nunca bloquean el flujo principal.
 */

/**
 * Dispara un trigger de email de forma asíncrona (fire-and-forget).
 * No lanza excepciones — los errores se loguean silenciosamente.
 */
export async function dispararTriggerEmail(
    codigo_evento: string,
    datos: Record<string, any>,
    user_id?: string,
    template_id?: string
): Promise<void> {
    try {
        // Obtenemos el email prioritario si existe en los datos
        const emailDestino = datos.email_nuevo || datos.usuario_email || datos.email;

        const { error } = await supabase.functions.invoke('dispatch-marketing-event', {
            body: { 
                event_type: codigo_evento, 
                variables: datos,
                user_id: user_id || datos.usuario_id,
                email: emailDestino,
                template_id: template_id
            }
        });

        if (error) {
            console.error(`[emailTrigger] Error disparando ${codigo_evento}:`, error);
        }
    } catch (err) {
        // Fire-and-forget: nunca bloquea el flujo principal
        console.error(`[emailTrigger] Excepción disparando ${codigo_evento}:`, err);
    }
}

/**
 * Envía una prueba real de una plantilla usando el dispatcher.
 * Registra en email_historial con tipo_envio = 'prueba'.
 */
export async function enviarPruebaPlantilla(params: {
    plantilla_id: string;
    email_destino: string;
    datos_usuario: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { data, error } = await supabase.functions.invoke('dispatch-marketing-event', {
            body: {
                event_type: 'template_test',
                variables: params.datos_usuario,
                is_test_email: true,
                template_id: params.plantilla_id,
                email: params.email_destino
            }
        });

        if (error) {
            console.error('[emailTrigger] invoke error:', error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        return { success: data?.success || false };
    } catch (err: any) {
        console.error('[emailTrigger] Unexpected error:', err);
        return { success: false, error: err.message || 'Error inesperado en el cliente' };
    }
}
