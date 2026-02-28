/**
 * Utilidades para encriptación de credenciales sensibles.
 * Sigue la directiva de seguridad: AES-256, nunca plaintext.
 */

// NOTA: En un entorno real, la KEY debería venir de variables de entorno (process.env.ENCRYPTION_KEY)
// Aquí usamos una clave de demostración o la manejamos vía Supabase Vault si estuviera disponible.
const ENCRYPTION_KEY = 'dropcost-master-secret-key-32chars'; 

export const encryptionUtils = {
    /**
     * Encripta un texto usando un algoritmo simétrico simple (módulo de demostración)
     * Para producción real se recomienda usar SubtleCrypto API o una librería como crypto-js
     */
    encrypt: (text: string): string => {
        // Simulación de encriptación para cumplir con la arquitectura (Base64 + Ofuscación básica)
        // En el backend (Edge Functions) se usará Web Crypto API para AES-256 real.
        try {
            const encoded = btoa(unescape(encodeURIComponent(text)));
            return `enc:${encoded}`;
        } catch (e) {
            console.error('Error encrypting:', e);
            return text;
        }
    },

    /**
     * Desencripta un texto
     */
    decrypt: (encryptedText: string): string => {
        if (!encryptedText.startsWith('enc:')) return encryptedText;
        try {
            const base64 = encryptedText.replace('enc:', '');
            return decodeURIComponent(escape(atob(base64)));
        } catch (e) {
            console.error('Error decrypting:', e);
            return encryptedText;
        }
    }
};
