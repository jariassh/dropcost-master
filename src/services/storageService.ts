import { supabase } from '../lib/supabase';

export const storageService = {
    /**
     * Sube un archivo al bucket 'branding'
     */
    async uploadBrandingFile(file: File, path: string): Promise<string> {
        try {
            const { data, error } = await supabase.storage
                .from('branding')
                .upload(path, file, {
                    upsert: true,
                    cacheControl: '3600'
                });

            if (error) {
                console.error('Error uploading file:', error);
                throw error;
            }

            // Obtener la URL pública
            const { data: publicUrlData } = supabase.storage
                .from('branding')
                .getPublicUrl(data.path);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('Storage service error:', error);
            throw error;
        }
    },

    /**
     * Elimina un archivo del bucket 'branding'
     */
    async deleteBrandingFile(path: string): Promise<void> {
        const { error } = await supabase.storage
            .from('branding')
            .remove([path]);

        if (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
};
