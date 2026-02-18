/**
 * Helper para disparar triggers de email desde el frontend.
 * Llama a la Edge Function email-trigger-dispatcher de forma fire-and-forget.
 * Los errores se loguean pero nunca bloquean el flujo principal.
 */

const DISPATCHER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-trigger-dispatcher`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Dispara un trigger de email de forma asíncrona (fire-and-forget).
 * No lanza excepciones — los errores se loguean silenciosamente.
 */
export async function dispararTriggerEmail(
    codigo_evento: string,
    datos: Record<string, string>
): Promise<void> {
    try {
        const res = await fetch(DISPATCHER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify({ codigo_evento, datos }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`[emailTrigger] Error disparando ${codigo_evento}:`, body);
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
        const res = await fetch(DISPATCHER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY,
            },
            body: JSON.stringify({
                // Usamos un codigo_evento especial para pruebas manuales
                // El dispatcher lo maneja con plantilla_id_prueba
                codigo_evento: '__PRUEBA_MANUAL__',
                datos: params.datos_usuario,
                tipo_envio: 'prueba',
                plantilla_id_prueba: params.plantilla_id,
                email_destino_prueba: params.email_destino,
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            return { success: false, error: body };
        }

        const data = await res.json();
        return { success: data.emails_enviados > 0 };
    } catch (err: any) {
        return { success: false, error: err.message || 'Error desconocido' };
    }
}
