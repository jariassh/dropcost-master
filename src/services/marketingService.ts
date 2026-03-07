/**
 * Servicio para Email Marketing.
 * Implementa la lógica de obtención de listas, campañas y métricas conectando con Supabase.
 */
import { supabase } from '@/lib/supabase';
import { EmailSegment, EmailCampaign, EmailTemplate, SegmentFilters, FilterCondition } from '@/types/marketing';

/**
 * Obtiene el resumen del dashboard de marketing para una tienda específica.
 */
export const getMarketingStats = async (tiendaId?: string, userId?: string) => {
    // Verificamos si es admin para decidir si filtramos
    const { data: userData } = await supabase.from('users').select('rol').eq('id', userId || '').maybeSingle();
    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'superadmin';

    // 1. Campañas y Segmentos
    let campaignsQuery = supabase
        .from('email_campaigns' as any)
        .select('*', { count: 'exact', head: true });
    
    if (!isAdmin && tiendaId) campaignsQuery = campaignsQuery.eq('tienda_id', tiendaId);
    if (!isAdmin && userId) campaignsQuery = campaignsQuery.eq('usuario_id', userId);
    
    const { count: totalCampaigns } = await campaignsQuery;

    let segmentsQuery = supabase
        .from('email_segments' as any)
        .select('*', { count: 'exact', head: true });
        
    if (!isAdmin && tiendaId) segmentsQuery = segmentsQuery.eq('tienda_id', tiendaId);
    if (!isAdmin && userId) segmentsQuery = segmentsQuery.eq('usuario_id', userId);

    const { count: activeSegments } = await segmentsQuery;

    // 2. Automation (Nuevo Trigger Central: marketing_events)
    // Obtenemos estadísticas globales de la nueva tabla centralizada
    const { data: marketingEvents } = await supabase
        .from('marketing_events' as any)
        .select('status');

    const eventStats = (marketingEvents as any[]) || [];
    const totalEventsSent = eventStats.filter((e: any) => e.status === 'sent').length;
    const totalEventsFailed = eventStats.filter((e: any) => e.status === 'failed').length;

    // 3. Mapeos Activos
    const { count: activeMappings } = await supabase
        .from('marketing_event_mappings' as any)
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true);

    const totalSent = totalEventsSent;

    return {
        totalCampaigns: totalCampaigns || 0,
        totalEmailsSent: totalSent,
        avgSuccessRate: totalSent > 0 
            ? Math.round(((totalSent) / (totalSent + totalEventsFailed)) * 1000) / 10 
            : 0,
        activeSegments: activeSegments || 0,
        activeTriggers: activeMappings || 0,
        failedEmails: totalEventsFailed
    };
};

/**
 * Obtiene todas las campañas de email de una tienda.
 */
export const getCampaigns = async (tiendaId?: string, userId?: string): Promise<EmailCampaign[]> => {
    // Verificamos si es admin
    const { data: userData } = await supabase.from('users').select('rol').eq('id', userId || '').maybeSingle();
    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'superadmin';

    let query = supabase
        .from('email_campaigns' as any)
        .select(`
            *,
            stats:email_campaign_logs(status)
        `);
    
    if (!isAdmin && tiendaId) query = query.eq('tienda_id', tiendaId);
    if (!isAdmin && userId) query = query.eq('usuario_id', userId);
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar los logs en estadísticas resumidas
    return (data || []).map((campaign: any) => {
        const logs = campaign.stats || [];
        const total = logs.length;
        const sent = logs.filter((l: any) => l.status === 'sent').length;
        const failed = logs.filter((l: any) => l.status === 'failed').length;
        const pending = logs.filter((l: any) => l.status === 'pending').length;

        return {
            ...campaign,
            stats: total > 0 ? { total, sent, failed, pending } : undefined
        };
    }) as unknown as EmailCampaign[];
};

/**
 * Obtiene todas las listas/segmentos inteligentes de una tienda.
 */
export const getSegments = async (tiendaId?: string, userId?: string): Promise<EmailSegment[]> => {
    // Verificamos si es admin
    const { data: userData } = await supabase.from('users').select('rol').eq('id', userId || '').maybeSingle();
    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'superadmin';

    let query = supabase
        .from('email_segments' as any)
        .select('*');
        
    if (!isAdmin && tiendaId) query = query.eq('tienda_id', tiendaId);
    if (!isAdmin && userId) query = query.eq('usuario_id', userId);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calcular el conteo real de miembros para cada segmento
    const segmentsWithCount = await Promise.all((data || []).map(async (seg: any) => {
        try {
            const count = await estimateAudience(seg.filters);
            return {
                ...seg,
                count
            };
        } catch (e) {
            console.error(`Error calculating count for segment ${seg.id}:`, e);
            return {
                ...seg,
                count: 0
            };
        }
    }));

    return segmentsWithCount as unknown as EmailSegment[];
};

/**
 * Obtiene un segmento por su ID.
 */
export const getSegmentById = async (id: string): Promise<EmailSegment> => {
    const { data, error } = await supabase
        .from('email_segments' as any)
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as unknown as EmailSegment;
};

/**
 * Elimina un segmento inteligente.
 */
export const deleteSegment = async (segmentId: string) => {
    const { error } = await supabase
        .from('email_segments' as any)
        .delete()
        .eq('id', segmentId);

    if (error) throw error;
    return true;
};

/**
 * Obtiene los detalles de una campaña específica por ID.
 */
export const getCampaignById = async (campaignId: string) => {
    const { data, error } = await supabase
        .from('email_campaigns' as any)
        .select(`
            *,
            segment:segment_id(*)
        `)
        .eq('id', campaignId)
        .single();

    if (error) throw error;
    
    // Si la campaña tiene un segmento, calculamos su conteo real
    if (data && (data as any).segment) {
        try {
            const count = await estimateAudience((data as any).segment.filters);
            (data as any).segment.count = count;
        } catch (e) {
            console.error("Error estimating audience for campaign segment:", e);
            (data as any).segment.count = 0;
        }
    }
    
    return data;
};

/**
 * Obtiene los logs de envío de una campaña específica.
 */
export const getCampaignLogs = async (campaignId: string) => {
    const { data, error } = await supabase
        .from('email_campaign_logs' as any)
        .select(`
            *,
            user:user_id(nombres, apellidos)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Elimina una campaña de marketing.
 */
export const deleteCampaign = async (campaignId: string) => {
    // Primero borrar los logs si es necesario por constraint, aunque cascada debería funcionar.
    await supabase.from('email_campaign_logs' as any).delete().eq('campaign_id', campaignId);
    
    const { error } = await supabase
        .from('email_campaigns' as any)
        .delete()
        .eq('id', campaignId);

    if (error) throw error;
    return true;
};

/**
 * Obtiene las plantillas de email disponibles.
 */
export const getTemplates = async (): Promise<EmailTemplate[]> => {
    const { data, error } = await supabase
        .from('email_templates' as any)
        .select('*')
        .eq('status', 'activo')
        .eq('is_folder', false)
        .order('name');

    if (error) throw error;
    return (data || []) as unknown as EmailTemplate[];
};

/**
 * Crea una nueva campaña.
 */
export const createCampaign = async (campaign: Partial<EmailCampaign>) => {
    const { data, error } = await supabase
        .from('email_campaigns' as any)
        .insert(campaign)
        .select()
        .single();

    if (error) throw error;
    return data as unknown as EmailCampaign;
};

/**
 * Lanza una campaña: procesa el segmento, genera logs y marca como procesada.
 */
export const launchCampaign = async (campaignId: string) => {
    // 1. Obtener datos de la campaña
    const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns' as any)
        .select('*, segment:segment_id(*)')
        .eq('id', campaignId)
        .single();

    if (campaignError) throw campaignError;
    const realCampaign = campaign as any;

    // 2. Obtener usuarios filtrados
    const filters = realCampaign.segment?.filters;
    if (!filters) throw new Error('Campaña sin segmento o filtros configurados');

    // Reutilizamos la lógica de estimateAudience pero obteniendo los datos
    let query = supabase.from('users').select('id, email, nombres, apellidos');
    
    const { conditions, operator } = filters as SegmentFilters;
    if (conditions?.length > 0) {
        if (operator === 'OR') {
            const orString = conditions.map((c: FilterCondition) => {
                const field = c.field === 'country' ? 'pais' : 
                             c.field === 'status' ? 'estado_suscripcion' : 
                             c.field === 'plan' ? 'plan_id' :
                             c.field === 'rol' ? 'rol' :
                             c.field === 'last_login' ? 'ultima_actividad' : c.field;
                if (c.operator === 'equals') return `${field}.ilike.${c.value}`;
                if (c.operator === 'not_equals') return `${field}.neq.${c.value}`;
                if (c.operator === 'contains') return `${field}.ilike.%${c.value}%`;
                return '';
            }).filter(Boolean).join(',');
            if (orString) query = query.or(orString);
        } else {
            conditions.forEach((c: FilterCondition) => {
                const field = c.field === 'country' ? 'pais' : 
                             c.field === 'status' ? 'estado_suscripcion' : 
                             c.field === 'plan' ? 'plan_id' :
                             c.field === 'rol' ? 'rol' :
                             c.field === 'last_login' ? 'ultima_actividad' : c.field;
                if (c.operator === 'equals') query = query.ilike(field, c.value);
                if (c.operator === 'not_equals') query = query.neq(field, c.value);
                if (c.operator === 'contains') query = query.ilike(field, `%${c.value}%`);
            });
        }
    }

    const { data: users, error: usersError } = await query;
    if (usersError) throw usersError;
    if (!users || users.length === 0) throw new Error('No hay usuarios que coincidan con el segmento');

    // 3. Crear registros de log masivos e INVOCAR EL EMAIL TRIGGER REALMENTE POR CADA USUARIO
    const logs = users.map(u => ({
        campaign_id: campaignId,
        tienda_id: realCampaign.tienda_id,
        user_id: u.id,
        email: u.email,
        status: 'sent' // Lo marcamos como sent asumiendo que el trigger hará su trabajo, o se puede mapear luego
    }));

    const { error: logError } = await supabase
        .from('email_campaign_logs' as any)
        .insert(logs);

    if (logError) throw logError;

    // Disparamos los correos de verdad mediante la nueva API centralizada
    // Omitimos Promise.all directo sin límite para no ahogar el navegador, enviamos de forma asíncrona
    users.forEach(async (u) => {
        try {
            const { error: invokeError } = await supabase.functions.invoke('dispatch-marketing-event', {
                body: {
                    event_type: 'mass_campaign',
                    variables: { 
                        usuario_nombre: u.nombres || '', 
                        nombres: u.nombres || '',
                        apellidos: u.apellidos || '',
                        email: u.email,
                        app_url: window.location.origin,
                        base_url: window.location.origin,
                        verify_url: `${window.location.origin}/verify-email` // Fallback URL
                    },
                    user_id: u.id,
                    email: u.email,
                    template_id: realCampaign.template_id
                }
            });
            if (invokeError) console.error("Error disparando para", u.email, invokeError);
        } catch (e) {
            console.error("Error en batch", e);
        }
    });

    // 4. Actualizar estado de la campaña
    const { error: updateError } = await supabase
        .from('email_campaigns' as any)
        .update({ status: 'completed' }) 
        .eq('id', campaignId);

    if (updateError) throw updateError;

    return { success: true, count: users.length };
};

/**
 * Crea o actualiza un segmento inteligente.
 */
export const saveSegment = async (segment: Partial<EmailSegment>) => {
    if (segment.id) {
        const { data, error } = await supabase
            .from('email_segments' as any)
            .update(segment)
            .eq('id', segment.id)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as EmailSegment;
    } else {
        const { data, error } = await supabase
            .from('email_segments' as any)
            .insert(segment)
            .select()
            .single();
        if (error) throw error;
        return data as unknown as EmailSegment;
    }
};

/**
 * Estima la audiencia de un segmento basado en filtros JSON.
 */
export const estimateAudience = async (filters: SegmentFilters): Promise<number> => {
    try {
        let query = supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        const { conditions, operator } = filters;

        if (conditions.length > 0) {
            if (operator === 'OR') {
                // Para OR, construimos un string de filtros or()...
                const orString = conditions.map((c: FilterCondition) => {
                    const field = c.field === 'country' ? 'pais' : 
                                 c.field === 'status' ? 'estado_suscripcion' : 
                                 c.field === 'plan' ? 'plan_id' :
                                 c.field === 'rol' ? 'rol' :
                                 c.field === 'last_login' ? 'ultima_actividad' : c.field;
                    
                    if (c.operator === 'equals') return `${field}.ilike.${c.value}`;
                    if (c.operator === 'not_equals') return `${field}.neq.${c.value}`;
                    if (c.operator === 'contains') return `${field}.ilike.%${c.value}%`;
                    if (c.operator === 'greater_than') return `${field}.gt.${c.value}`;
                    if (c.operator === 'less_than') return `${field}.lt.${c.value}`;
                    return '';
                }).filter(Boolean).join(',');
                
                if (orString) query = query.or(orString);
            } else {
                // Para AND, aplicamos filtros secuencialmente
                conditions.forEach((c: FilterCondition) => {
                    const field = c.field === 'country' ? 'pais' : 
                                 c.field === 'status' ? 'estado_suscripcion' : 
                                 c.field === 'plan' ? 'plan_id' :
                                 c.field === 'rol' ? 'rol' :
                                 c.field === 'last_login' ? 'ultima_actividad' : c.field;

                    if (c.operator === 'equals') query = query.ilike(field, c.value);
                    if (c.operator === 'not_equals') query = query.neq(field, c.value);
                    if (c.operator === 'contains') query = query.ilike(field, `%${c.value}%`);
                    if (c.operator === 'greater_than') query = query.gt(field, c.value);
                    if (c.operator === 'less_than') query = query.lt(field, c.value);
                });
            }
        }

        const { count, error } = await query;
        if (error) throw error;
        
        return count || 0;
    } catch (error) {
        console.error('Error estimating audience:', error);
        return 0;
    }
};

/**
 * Obtiene el historial global de envíos.
 */
export const getGlobalEmailHistory = async (limit = 200) => {
    const { data, error } = await supabase
        .from('marketing_events' as any)
        .select(`
            *,
            template:template_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as any[] || []);
};

/**
 * Obtiene todos los triggers de automatización.
 */
export const getEmailTriggers = async () => {
    try {
        const { data, error } = await supabase
            .from('marketing_event_mappings' as any)
            .select(`
                *,
                template:template_id (name)
            `)
            .order('event_type');

        if (error) throw error;

        return (data || []).map((m: any) => ({
            ...m,
            template_name: m.template?.name || 'Plantilla desconocida'
        }));
    } catch (error) {
        console.error('Error fetching email triggers:', error);
        return [];
    }
};

/**
 * Actualiza la plantilla mapeada a un evento de automatización.
 */
export const updateEmailTriggerMapping = async (event_type: string, template_id: string, enabled: boolean) => {
    try {
        const { data, error } = await supabase
            .from('marketing_event_mappings' as any)
            .update({ template_id, enabled, updated_at: new Date().toISOString() })
            .eq('event_type', event_type)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating email trigger mapping:', error);
        throw error;
    }
};
