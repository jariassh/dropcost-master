import { supabase } from '@/lib/supabase';

export interface GlobalConfig {
    id: string;
    
    // SEO
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_image_url: string;
    site_url: string;
    email_domain: string;

    
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
    color_neutral: string;
    color_bg_primary: string;
    color_bg_secondary: string;
    color_bg_tertiary: string;
    color_card_bg: string;
    color_text_primary: string;
    color_text_secondary: string;
    color_text_tertiary: string;
    color_text_inverse: string;
    color_border: string;
    color_border_hover: string;
    color_card_border: string;

    // Modo Oscuro (Específicos)
    dark_bg_primary: string;
    dark_bg_secondary: string;
    dark_bg_tertiary: string;
    dark_card_bg: string;
    dark_card_border: string;
    dark_text_primary: string;
    dark_text_secondary: string;
    dark_text_tertiary: string;
    dark_border: string;
    dark_border_hover: string;
    
    // Sidebar
    color_sidebar_bg: string;
    color_sidebar_text: string;
    color_sidebar_active: string;

    // Administración
    color_admin_panel_link: string;
    color_admin_sidebar_active: string;
    color_admin_sidebar_return: string;
    
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
    
    // Poláticas
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

        if (error) {
            console.error('Error refreshing config cache:', error);
            // Don't throw, let it fallback to default if desired or handle gracefully
        }
        
        if (!data) {
             // console.log('[ConfigService] Usando configuración por defecto (ID: ' + CONFIG_ID + ')');
             // Instead of throwing, we might just return default values or null
             // For now, let's return default values simulating a fetched config
             // so the app doesn't crash on login
             const fallback: GlobalConfig = {
                id: CONFIG_ID,
                meta_title: 'DropCost Master',
                meta_description: 'Calculadora de costos para dropshipping',
                meta_keywords: 'dropshipping, costos, calculadora',
                og_image_url: '',
                site_url: 'https://dropcost.com',
                email_domain: 'dropcost.jariash.com',
                permitir_indexacion: true,
                permitir_seguimiento: true,
                robots_txt_custom: '',
                favicon_url: '',
                logo_principal_url: '',
                logo_variante_url: '',
                logo_footer_url: '',
                color_primary: '#0066FF',
                color_primary_dark: '#0052cc',
                color_primary_light: '#e6f0ff',
                color_success: '#10B981',
                color_error: '#EF4444',
                color_warning: '#F59E0B',
                color_neutral: '#6B7280',
                color_bg_primary: '#FFFFFF',
                color_bg_secondary: '#F9FAFB',
                color_bg_tertiary: '#F3F4F6',
                color_card_bg: '#FFFFFF',
                color_text_primary: '#1F2937',
                color_text_secondary: '#6B7280',
                color_text_tertiary: '#9CA3AF',
                color_text_inverse: '#FFFFFF',
                color_border: '#E5E7EB',
                color_border_hover: '#D1D5DB',
                color_card_border: '#E5E7EB',
                dark_bg_primary: '#1F2937',
                dark_bg_secondary: '#111827',
                dark_bg_tertiary: '#374151',
                dark_card_bg: '#1F2937',
                dark_card_border: '#374151',
                dark_text_primary: '#F9FAFB',
                dark_text_secondary: '#D1D5DB',
                dark_text_tertiary: '#9CA3AF',
                dark_border: '#374151',
                dark_border_hover: '#4B5563',
                color_sidebar_bg: '#0F172A',
                color_sidebar_text: '#94A3B8',
                color_sidebar_active: '#0066FF',
                color_admin_panel_link: '#F3F4F6',
                color_admin_sidebar_active: '#10B981',
                color_admin_sidebar_return: '#EF4444',
                
                codigo_head: '',
                codigo_footer: '',
                
                nombre_empresa: 'DropCost',
                descripcion_empresa: 'Software de costeo',
                sitio_web: 'https://dropcost.com',
                email_contacto: 'soporte@dropcost.com',
                telefono: '',
                pais_operacion: 'CO',
                
                instagram_url: '',
                linkedin_url: '',
                twitter_url: '',
                youtube_url: '',
                
                terminos_condiciones_url: '',
                politica_privacidad_url: ''
             };
             localStorage.setItem(CACHE_KEY, JSON.stringify(fallback));
             return fallback;
        }

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

        // MAPEO MANUAL EXPLìCITO para evitar cualquier fallo
        const updateData: any = {};
        const fields = [
            'meta_title', 'meta_description', 'meta_keywords', 'og_image_url', 'site_url',
            'favicon_url', 'logo_principal_url', 'logo_variante_url', 'logo_footer_url',
            'nombre_empresa', 'descripcion_empresa', 'sitio_web', 'email_contacto', 'telefono',
            // Colores de marca
            'color_primary', 'color_primary_dark', 'color_primary_light',
            // Semánticos
            'color_success', 'color_error', 'color_warning', 'color_neutral',
            // Fondos
            'color_bg_primary', 'color_bg_secondary', 'color_bg_tertiary', 'color_card_bg',
            // Texto
            'color_text_primary', 'color_text_secondary', 'color_text_tertiary', 'color_text_inverse',
            // Bordes
            'color_border', 'color_border_hover', 'color_card_border',
            // Modo Oscuro
            'dark_bg_primary', 'dark_bg_secondary', 'dark_bg_tertiary', 'dark_card_bg', 'dark_card_border',
            'dark_text_primary', 'dark_text_secondary', 'dark_text_tertiary',
            'dark_border', 'dark_border_hover',
            // Sidebar
            'color_sidebar_bg', 'color_sidebar_text', 'color_sidebar_active',
            // Administración
            'color_admin_panel_link', 'color_admin_sidebar_active', 'color_admin_sidebar_return',
            // SEO
            'codigo_head', 'codigo_footer',
            'permitir_indexacion', 'permitir_seguimiento',
            'email_domain'
        ];

        fields.forEach(f => {
            if ((changes as any)[f] !== undefined) {
                updateData[f] = (changes as any)[f];
            }
        });

        /*
        console.log('>>> DB UPDATE START:', targetId);
        console.log('>>> ALL KEYS IN CHANGES:', Object.keys(changes));
        console.log('>>> BRANDING VALUES TO SAVE:', {
            favicon: updateData.favicon_url,
            logo: updateData.logo_principal_url,
            variante: updateData.logo_variante_url,
            og: updateData.og_image_url
        });
        */

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

        // console.log('>>> DB UPDATE SUCCESS:', data[0]);
        
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
            // Marca
            color_primary: '#0066FF',
            color_primary_dark: '#003D99',
            color_primary_light: '#E6F0FF',
            // Semánticos
            color_success: '#10B981',
            color_warning: '#F59E0B',
            color_error: '#EF4444',
            color_neutral: '#6B7280',
            // Fondos (modo claro)
            color_bg_primary: '#FFFFFF',
            color_bg_secondary: '#F3F4F6',
            color_bg_tertiary: '#F9FAFB',
            color_card_bg: '#FFFFFF',
            // Texto
            color_text_primary: '#1F2937',
            color_text_secondary: '#6B7280',
            color_text_tertiary: '#9CA3AF',
            color_text_inverse: '#FFFFFF',
            // Bordes
            color_border: '#E5E7EB',
            color_border_hover: '#D1D5DB',
            // Sidebar (Siempre Oscuro por preferencia premium)
            color_sidebar_bg: '#0F172A',
            color_sidebar_text: '#94A3B8',
            color_sidebar_active: '#0066FF',
            // Valores por defecto Modo Oscuro
            dark_bg_primary: '#0F172A',
            dark_bg_secondary: '#1E293B',
            dark_bg_tertiary: '#334155',
            dark_card_bg: '#1E293B',
            dark_card_border: '#334155',
            dark_text_primary: '#F1F5F9',
            dark_text_secondary: '#94A3B8',
            dark_text_tertiary: '#64748B',
            dark_border: '#334155',
            dark_border_hover: '#475569',
            color_card_border: '#E5E7EB',
            color_admin_panel_link: '#EF4444',
            color_admin_sidebar_active: '#EF4444',
            color_admin_sidebar_return: '#1F2937',
        };
        await this.updateConfig(defaults);
    },

    // --- EMAIL TEMPLATES ---
    async getEmailTemplates() {
        const { data, error } = await supabase
            .from('email_templates' as any)
            .select('*, updated_by_user:users(nombres, apellidos, avatar_url)')
            .order('is_folder', { ascending: false }) // Folders first
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        return (data as any[]).map(item => ({
            ...item,
            updated_by_name: item.updated_by_user ? `${item.updated_by_user.nombres || ''} ${item.updated_by_user.apellidos || ''}`.trim() : 'SISTEMA',
            updated_by_avatar: item.updated_by_user?.avatar_url
        }));
    },

    async updateEmailTemplate(id: string, updates: any) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('email_templates' as any)
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            })
            .eq('id', id)
            .select('*, updated_by_user:users(nombres, apellidos, avatar_url)')
            .single();
        if (error) throw error;
        const result = data as any;
        return {
            ...result,
            updated_by_name: result.updated_by_user ? `${result.updated_by_user.nombres || ''} ${result.updated_by_user.apellidos || ''}`.trim() : 'SISTEMA',
            updated_by_avatar: result.updated_by_user?.avatar_url
        };
    },

    async createEmailTemplate(template: any) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('email_templates' as any)
            .insert({
                ...template,
                status: template.status || 'activo',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                updated_by: user?.id
            })
            .select('*, updated_by_user:users(nombres, apellidos, avatar_url)')
            .single();
        if (error) throw error;
        const result = data as any;
        return {
            ...result,
            updated_by_name: result.updated_by_user ? `${result.updated_by_user.nombres || ''} ${result.updated_by_user.apellidos || ''}`.trim() : 'SISTEMA',
            updated_by_avatar: result.updated_by_user?.avatar_url
        };
    },

    async deleteEmailTemplate(id: string) {
        const { error } = await supabase
            .from('email_templates' as any)
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};

