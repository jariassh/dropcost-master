import { supabase } from '@/lib/supabase';

export interface GlobalConfig {
    id: string;
    
    // SEO
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image_url: string;
    site_url: string;
    sitemap_url: string;
    
    // Robots
    permitir_indexacion: boolean;
    permitir_seguimiento: boolean;
    robots_txt_custom: string;
    
    // Branding
    favicon_url: string;
    logo_principal_url: string;
    logo_variante_url: string; // Logo para fondos oscuros
    logo_footer_url: string;
    
    // Colores
    color_primary: string;
    color_primary_dark: string;
    color_primary_light: string;
    color_success: string;
    color_error: string;
    color_warning: string;
    color_bg_primary: string;
    color_bg_secondary: string;
    color_text_primary: string;
    color_text_secondary: string;
    
    // Sidebar
    color_sidebar_bg: string;
    color_sidebar_text: string;
    
    // Tracking
    codigo_head: string;
    codigo_footer: string;
    
    // Información
    nombre_empresa: string;
    descripcion_empresa: string;
    sitio_web: string;
    email_contacto: string;
    telefono: string;
    pais_operacion: string;
    
    // Redes sociales
    instagram_url: string;
    linkedin_url: string;
    twitter_url: string;
    youtube_url: string;
    
    // Políticas
    terminos_condiciones_url: string;
    politica_privacidad_url: string;
    
    actualizado_por?: string;
    fecha_actualizacion?: string;
}

export interface ConfigHistory {
    id: string;
    campo_modificado: string;
    valor_anterior: string;
    valor_nuevo: string;
    usuario_admin: string;
    fecha_cambio: string;
    admin_name?: string;
}

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';
const CACHE_KEY = 'dc_global_config_cache';

export const configService = {
    /**
     * Obtiene la configuración global actual (con caché local para velocidad instantánea)
     */
    async getConfig(): Promise<GlobalConfig> {
        // 1. Intentar cargar desde caché para respuesta inmediata
        const cached = localStorage.getItem(CACHE_KEY);
        let config: GlobalConfig | null = null;
        
        if (cached) {
            try {
                config = JSON.parse(cached);
                // Retornamos la caché inmediatamente para que la UI no espere
                // Pero lanzamos la petición de red en segundo plano para actualizar
                this.refreshCache(); 
                return config!;
            } catch (e) {
                console.error('Error parsing config cache:', e);
            }
        }

        // 2. Si no hay caché o falló, ir a la DB
        return await this.refreshCache();
    },

    /**
     * Refresca la caché local desde la base de datos
     */
    async refreshCache(): Promise<GlobalConfig> {
        const { data, error } = await supabase
            .from('configuracion_global' as any)
            .select('*')
            .eq('id', CONFIG_ID)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('No se encontró configuración global.');

        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data as unknown as GlobalConfig;
    },

    /**
     * Actualiza la configuración global
     */
    async updateConfig(changes: Partial<GlobalConfig>): Promise<GlobalConfig> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const targetId = CONFIG_ID;

        // MAPEO MANUAL EXPLÍCITO para evitar cualquier fallo
        const updateData: any = {};
        const fields = [
            'meta_title', 'meta_description', 'meta_keywords', 'og_image_url', 'site_url', 'sitemap_url',
            'favicon_url', 'logo_principal_url', 'logo_variante_url', 'logo_footer_url',
            'nombre_empresa', 'descripcion_empresa', 'sitio_web', 'email_contacto', 'telefono',
            'color_primary', 'color_primary_dark', 'color_primary_light',
            'color_bg_primary', 'color_bg_secondary', 'color_text_primary', 'color_text_secondary',
            'color_sidebar_bg', 'color_sidebar_text',
            'codigo_head', 'codigo_footer'
        ];

        fields.forEach(f => {
            if ((changes as any)[f] !== undefined) {
                updateData[f] = (changes as any)[f];
            }
        });

        console.log('>>> DB UPDATE START:', targetId);
        console.log('>>> ALL KEYS IN CHANGES:', Object.keys(changes));
        console.log('>>> BRANDING VALUES TO SAVE:', {
            favicon: updateData.favicon_url,
            logo: updateData.logo_principal_url,
            variante: updateData.logo_variante_url,
            og: updateData.og_image_url
        });

        const { data, error } = await supabase
            .from('configuracion_global' as any)
            .update({
                ...updateData,
                actualizado_por: user.id,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('id', targetId)
            .select();

        if (error) {
            console.error('DATABASE ERROR:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error('No se pudo actualizar el registro. Es posible que no tengas permisos de administrador (RLS).');
        }

        console.log('>>> DB UPDATE SUCCESS:', data[0]);
        
        // Actualizamos la caché local inmediatamente
        localStorage.setItem(CACHE_KEY, JSON.stringify(data[0]));

        // Intentar registrar historial (opcional)
        try {
            const historyEntries = Object.keys(updateData).map(key => ({
                campo_modificado: key,
                valor_anterior: '...',
                valor_nuevo: String(updateData[key] || ''),
                usuario_admin: user.id
            }));
            if (historyEntries.length > 0) {
                await supabase.from('configuracion_global_historial' as any).insert(historyEntries.slice(0, 5));
            }
        } catch (e) {
            console.warn('Historial no guardado:', e);
        }

        return data[0] as unknown as GlobalConfig;
    },

    /**
     * Obtiene el historial de cambios
     */
    async getHistory(): Promise<ConfigHistory[]> {
        const { data, error } = await supabase
            .from('configuracion_global_historial' as any)
            .select('*, usuario_admin:users(nombres, apellidos)')
            .order('fecha_cambio', { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data as any[]).map(item => ({
            ...item,
            admin_name: `${item.usuario_admin?.nombres || ''} ${item.usuario_admin?.apellidos || ''}`.trim() || 'Admin'
        }));
    },

    /**
     * Restaura la configuración a los valores por defecto
     */
    async resetToDefaults(): Promise<void> {
        const defaults: Partial<GlobalConfig> = {
            meta_title: 'DropCost Master - Calculadora de Costos',
            meta_description: 'Herramienta de costeo para dropshipping.',
            color_primary: '#0066FF',
            color_bg_primary: '#FFFFFF',
            color_text_primary: '#1F2937'
        };
        await this.updateConfig(defaults);
    }
};
