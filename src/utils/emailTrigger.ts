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
    datos: Record<string, string>
): Promise<void> {
    try {
        const { error } = await supabase.functions.invoke('email-trigger-dispatcher', {
            body: { codigo_evento, datos }
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
    datos_usuario: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { data, error } = await supabase.functions.invoke('email-trigger-dispatcher', {
            body: {
                // Usamos un codigo_evento especial para pruebas manuales
                // El dispatcher lo maneja con plantilla_id_prueba
                codigo_evento: '__PRUEBA_MANUAL__',
                datos: params.datos_usuario,
                tipo_envio: 'prueba',
                plantilla_id_prueba: params.plantilla_id,
                email_destino_prueba: params.email_destino,
            }
        });

        if (error) {
            console.error('[emailTrigger] invoke error:', error);
            // supabase-js returns error as an object, usually with a message
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        if (data && data.emails_enviados === 0 && data.razon_error) {
            return { success: false, error: data.razon_error };
        }

        return { success: data?.emails_enviados > 0 || data?.message === 'ok' };
    } catch (err: any) {
        console.error('[emailTrigger] Unexpected error:', err);
        return { success: false, error: err.message || 'Error inesperado en el cliente' };
    }
}
