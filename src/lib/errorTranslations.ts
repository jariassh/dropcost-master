/**
 * Traductor de errores de Supabase al español latino.
 * Mapea los mensajes técnicos en inglés a mensajes amigables para el usuario.
 */

const ERROR_MAP: Record<string, string> = {
    'Invalid login credentials': 'Credenciales de acceso inválidas. Revisa tu correo y contraseña.',
    'User already registered': 'Este correo electrónico ya se encuentra registrado.',
    'Email not confirmed': 'Debes confirmar tu correo electrónico antes de iniciar sesión.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Invalid email': 'El formato del correo electrónico no es válido.',
    'User not found': 'No se encontró ningún usuario con este correo.',
    'Invalid OTP': 'El código de verificación es inválido o ha expirado.',
    'New password should be different from the old password': 'La nueva contraseña debe ser diferente a la anterior.',
    'Too many requests': 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.',
};

export function translateError(errorMsg: string): string {
    // Intentar encontrar una coincidencia exacta o parcial
    for (const [key, value] of Object.entries(ERROR_MAP)) {
        if (errorMsg.includes(key)) {
            return value;
        }
    }

    // Si no hay traducción, devolver el mensaje original o uno genérico
    return errorMsg || 'Ocurrió un error inesperado. Intenta de nuevo.';
}
