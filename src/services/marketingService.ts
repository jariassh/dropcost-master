/**
 * Servicio para Email Marketing.
 * Implementa la lógica de obtención de listas, campañas y métricas conectando con Supabase.
 */
import { supabase } from '@/lib/supabase';
import { EmailSegment, EmailCampaign, EmailTemplate, SegmentFilters, FilterCondition } from '@/types/marketing';

/**
 * Obtiene el resumen del dashboard de marketing para una tienda específica.
 */
export const getMarketingStats = async (tiendaId: string, userId: string) => {
    // Obtenemos conteos reales de la base de datos
    // Estas tablas SÍ tienen tienda_id y usuario_id
    const { count: totalCampaigns } = await supabase
        .from('email_campaigns' as any)
        .select('*', { count: 'exact', head: true })
        .eq('tienda_id', tiendaId)
        .eq('usuario_id', userId);

    const { count: activeSegments } = await supabase
        .from('email_segments' as any)
        .select('*', { count: 'exact', head: true })
        .eq('tienda_id', tiendaId)
        .eq('usuario_id', userId);

    // Para el total de emails enviados, sumamos los logs exitosos
    // Esta tabla tiene tienda_id y user_id (ojo con el nombre)
    const { data: sentLogs } = await supabase
        .from('email_campaign_logs' as any)
        .select('status')
        .eq('tienda_id', tiendaId)
        .eq('status', 'sent');

    const totalSent = (sentLogs as any[] | null)?.length || 0;

    // Estadísticas de automatización
    // email_triggers es GLOBAL (no tiene tienda_id ni usuario_id)
    const { count: activeTriggers } = await supabase
        .from('email_triggers' as any)
        .select('*', { count: 'exact', head: true })
        .eq('activo', true);

    // email_historial tiene usuario_id pero NO tiene tienda_id
    const { data: historyData } = await supabase
        .from('email_historial' as any)
        .select('estado')
        .eq('usuario_id', userId);

    const historyStats = (historyData as any[]) || [];

    const totalAutomationSent = historyStats.filter((h: any) => h.estado === 'enviado').length;
    const totalAutomationFailed = historyStats.filter((h: any) => h.estado === 'fallido').length;

    // Total histórico (Campañas + Automatización)
    const totalGlobalSent = totalSent + totalAutomationSent;

    return {
        totalCampaigns: totalCampaigns || 0,
        totalEmailsSent: totalGlobalSent,
        avgSuccessRate: totalGlobalSent > 0 
            ? Math.round(((totalGlobalSent) / (totalGlobalSent + totalAutomationFailed)) * 1000) / 10 
            : 0,
        activeSegments: activeSegments || 0,
        activeTriggers: activeTriggers || 0,
        failedEmails: totalAutomationFailed
    };
};

/**
 * Obtiene todas las campañas de email de una tienda.
 */
export const getCampaigns = async (tiendaId: string, userId: string): Promise<EmailCampaign[]> => {
    const { data, error } = await supabase
        .from('email_campaigns' as any)
        .select(`
            *,
            stats:email_campaign_logs(status)
        `)
        .eq('tienda_id', tiendaId)
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });

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
export const getSegments = async (tiendaId: string, userId: string): Promise<EmailSegment[]> => {
    const { data, error } = await supabase
        .from('email_segments' as any)
        .select('*')
        .eq('tienda_id', tiendaId)
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });

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

    // 3. Crear registros de log masivos
    const logs = users.map(u => ({
        campaign_id: campaignId,
        tienda_id: realCampaign.tienda_id,
        user_id: u.id,
        email: u.email,
        status: 'pending' // En un entorno real, un worker procesaría esto
    }));

    const { error: logError } = await supabase
        .from('email_campaign_logs' as any)
        .insert(logs);

    if (logError) throw logError;

    // 4. Actualizar estado de la campaña
    const { error: updateError } = await supabase
        .from('email_campaigns' as any)
        .update({ status: 'completed' }) // Marcamos como completed porque "ya se mandó a cola"
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
        .from('email_historial' as any)
        .select(`
            *,
            plantilla:plantilla_id (name),
            trigger:trigger_id (nombre_trigger, codigo_evento)
        `)
        .order('fecha_envio', { ascending: false })
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
            .from('email_triggers' as any)
            .select('*')
            .eq('activo', true)
            .order('nombre_trigger');

        if (error) throw error;

        // Obtener conteo de plantillas para cada trigger usando la tabla intermedia Correcta
        const { data: associations, error: countError } = await supabase
            .from('email_plantillas_triggers' as any)
            .select('trigger_id');

        if (countError) throw countError;

        const processedTriggers = (data as any[] || []).map((trigger: any) => ({
            ...trigger,
            variables_disponibles: Array.isArray(trigger.variables_disponibles) 
                ? trigger.variables_disponibles 
                : JSON.parse(trigger.variables_disponibles || '[]'),
            plantillas_count: (associations as any[] || []).filter((t: any) => t.trigger_id === trigger.id).length
        }));

        return processedTriggers;
    } catch (error) {
        console.error('Error fetching email triggers:', error);
        return [];
    }
};
