import { supabase } from '@/lib/supabase';

/**
 * Servicio para manejar la subida de archivos a Supabase Storage.
 * Ref: §VIII Seguridad (RLS obligatorio por carpeta de usuario)
 */
export const storageService = {
    /**
     * Sube un avatar al bucket 'avatars'.
     * Ruta: [userId]/[timestamp]_[filename]
     */
    async uploadAvatar(file: File, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'El archivo debe ser una imagen.' };
        }

        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return { success: false, error: 'La imagen es demasiado grande. Máximo 2MB.' };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_avatar.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        try {
            // 1. Subir el archivo
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 2. Obtener la URL pública
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return { success: true, url: data.publicUrl };
        } catch (error: any) {
            console.error('[storageService] Error detallado subiendo avatar:', {
                error,
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return { success: false, error: error.message || 'Error al subir la imagen' };
        }
    },

    /**
     * Sube un archivo al bucket 'branding'.
     * Ruta: [path]
     */
    async uploadBrandingFile(file: File, filePath: string): Promise<string> {
        try {
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            console.error('[storageService] Error subiendo archivo de branding:', error);
            throw error;
        }
    },

    /**
     * Elimina un archivo del storage
     */
    async deleteFile(bucket: string, path: string): Promise<boolean> {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        return !error;
    }
};
