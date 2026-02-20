/**
 * Servicio para el sistema de referidos.
 */
import { supabase } from '@/lib/supabase';

export interface ReferralStats {
    totalClicks: number;
    totalReferred: number;
    totalEarned: number;
    referralCode: string;
    // Fields
    minReferredForLeader: number;
    commissionLevel1: number;
    commissionLevel2: number;
    meses_vigencia_comision: number;
}

export interface ReferralConfig {
    comision_nivel_1: number;
    comision_nivel_2: number;
    referidos_minimo_lider: number;
    meses_vigencia_comision: number;
    fecha_actualizacion: string;
    actualizado_por: string | null;
}

export interface ReferredUser {
    id: string;
    email: string;
    nombres?: string;
    apellidos?: string;
    status: 'pending' | 'completed';
    planId?: string;
    emailVerificado?: boolean;
    estadoSuscripcion?: string;
    createdAt: string;
}

/**
 * Obtiene las estadísticas de referidos del usuario actual.
 */
/**
 * Obtiene las estadísticas de referidos del usuario actual.
 */
export async function getReferralStats(): Promise<ReferralStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalClicks: 0, totalReferred: 0, totalEarned: 0, referralCode: '', minReferredForLeader: 50, commissionLevel1: 15, commissionLevel2: 5, meses_vigencia_comision: 12 };

    // 1. Obtener datos del usuario y configuración
    const [userDataRes, leaderStatsRes, configRes] = await Promise.all([
        supabase.from('users').select('codigo_referido_personal, wallet_saldo').eq('id', user.id).single(),
        supabase.from('referidos_lideres').select('total_clicks, total_usuarios_referidos').eq('user_id', user.id).maybeSingle(),
        supabase.from('sistema_referidos_config').select('*').order('fecha_actualizacion', { ascending: false }).limit(1).maybeSingle()
    ]);

    if (configRes.error && configRes.error.code !== 'PGRST116') {
        console.error('Error fetching referral config:', configRes.error);
    }
    if (leaderStatsRes.error && leaderStatsRes.error.code !== 'PGRST116') {
        console.error('Error fetching leader stats:', leaderStatsRes.error);
    }

    const userData = userDataRes.data;
    const leaderStats = leaderStatsRes.data;
    const config = configRes.data;

    return {
        totalClicks: leaderStats?.total_clicks || 0,
        totalReferred: leaderStats?.total_usuarios_referidos || 0,
        totalEarned: userData?.wallet_saldo || 0,
        referralCode: userData?.codigo_referido_personal || '',
        minReferredForLeader: config?.referidos_minimo_lider || 50,
        commissionLevel1: config?.comision_nivel_1 || 15,
        commissionLevel2: config?.comision_nivel_2 || 5,
        meses_vigencia_comision: config?.meses_vigencia_comision || 12
    };
}

/**
 * Obtiene la configuración global de referidos.
 */
export async function getReferralConfig(): Promise<ReferralConfig | null> {
    const { data, error } = await supabase
        .from('sistema_referidos_config')
        .select('*')
        .order('fecha_actualizacion', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) {
        console.error('Error fetching referral config:', error);
        return null;
    }
    return data;
}

/**
 * Incrementa el contador de clicks para un código de referido.
 */
export async function incrementReferralClicks(code: string): Promise<void> {
    if (!code) return;
    try {
        await supabase.rpc('increment_referral_clicks', { ref_code: code });
    } catch (error) {
        console.error('Error incrementing clicks:', error);
    }
}

/**
 * Obtiene el historial de comisiones.
 */
export async function getCommissionHistory(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('wallet_transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'referral_bonus')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching commission history:', error);
        return [];
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        date: t.created_at,
        status: 'completed'
    }));
}

/**
 * Obtiene la lista de usuarios referidos.
 */
export async function getReferredUsers(): Promise<ReferredUser[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Obtenemos los usuarios referidos uniéndolos con la tabla de líderes por el user_id actual
    const { data, error } = await supabase
        .from('referidos_usuarios')
        .select(`
            id,
            fecha_registro,
            usuario_id,
            users:usuario_id (email, nombres, apellidos, plan_id, email_verificado, estado_suscripcion),
            referidos_lideres!inner (user_id)
        `)
        .eq('referidos_lideres.user_id', user.id);

    if (error) {
        console.error('Error fetching referred users:', error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.usuario_id,
        email: r.users?.email || 'Usuario oculto',
        nombres: r.users?.nombres,
        apellidos: r.users?.apellidos,
        planId: r.users?.plan_id,
        emailVerificado: r.users?.email_verificado,
        estadoSuscripcion: r.users?.estado_suscripcion,
        status: 'completed',
        createdAt: r.fecha_registro
    }));
}

export interface ReferredUserDetails extends ReferredUser {
    referralsCount: number;
    commissionsEarned: number;
}

/**
 * Obtiene los detalles específicos de un usuario referido, incluyendo su impacto (Nivel 2).
 */
export async function getReferredUserDetails(referredUserId: string): Promise<ReferredUserDetails | null> {
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, nombres, apellidos, plan_id, email_verificado, estado_suscripcion, created_at')
        .eq('id', referredUserId)
        .single();

    if (userError || !userData) {
        console.error('Error fetching user details:', userError);
        return null;
    }

    // Buscamos si este usuario también es un referente (tiene entrada en referidos_lideres)
    // Para el conteo, contamos directamente de referidos_usuarios para mayor precisión
    const { data: leaderData } = await supabase
        .from('referidos_lideres')
        .select('id, total_comisiones_generadas')
        .eq('user_id', referredUserId)
        .maybeSingle();

    let referralsCount = 0;
    if (leaderData) {
        const { count } = await supabase
            .from('referidos_usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('lider_id', leaderData.id);
        referralsCount = count || 0;
    }

    return {
        id: userData.id,
        email: userData.email,
        nombres: userData.nombres || undefined,
        apellidos: userData.apellidos || undefined,
        planId: userData.plan_id || undefined,
        emailVerificado: userData.email_verificado ?? undefined,
        estadoSuscripcion: userData.estado_suscripcion || undefined,
        status: 'completed',
        createdAt: userData.created_at,
        referralsCount: referralsCount,
        commissionsEarned: leaderData?.total_comisiones_generadas || 0
    };
}

/**
 * Obtiene los referidos de nivel 2 para un líder con logs de depuración.
 */
export async function getLevel2ReferredUsers(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    console.log('[Referral] Fetching Nivel 2 for user:', user.email);

    // 1. Obtener mi ID de líder
    const { data: liderLink, error: liderError } = await supabase
        .from('referidos_lideres')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
    
    if (liderError) console.error('[Referral] Error Step 1 (My Leader ID):', liderError);
    if (!liderLink) {
        console.warn('[Referral] No leader profile found for current user. Level 2 impossible.');
        return [];
    }
    console.log('[Referral] Step 1 OK. My Lider ID:', liderLink.id);

    // 2. Obtener los IDs de mis referidos directos
    const { data: directReferrals, error: directError } = await supabase
        .from('referidos_usuarios')
        .select('usuario_id')
        .eq('lider_id', liderLink.id);

    if (directError) console.error('[Referral] Error Step 2 (Direct Referrals):', directError);
    if (!directReferrals || directReferrals.length === 0) {
        console.warn('[Referral] No direct referrals found (Level 1 is empty).');
        return [];
    }
    
    const directUserIds = directReferrals.map(dr => dr.usuario_id);
    console.log('[Referral] Step 2 OK. Direct Referral IDs:', directUserIds);

    // 3. Obtener los IDs de líderes de mis referidos (los sub-líderes que traen Nivel 2)
    const { data: subLeadersData, error: subLeadersError } = await supabase
        .from('referidos_lideres')
        .select('id, nombre, user_id')
        .in('user_id', directUserIds);

    if (subLeadersError) console.error('[Referral] Error Step 3 (Sub-Leaders):', subLeadersError);
    if (!subLeadersData || subLeadersData.length === 0) {
        console.warn('[Referral] None of your direct referrals are "leaders" yet (no secondary network).');
        return [];
    }
    
    const subLeaderIds = subLeadersData.map(sl => sl.id);
    console.log('[Referral] Step 3 OK. Sub-Leader IDs (Level 2 Roots):', subLeaderIds);

    // 4. Obtener los usuarios invitados por estos sub-líderes (Nivel 2)
    const { data, error } = await supabase
        .from('referidos_usuarios')
        .select(`
            id,
            fecha_registro,
            usuario_id,
            users:usuario_id (email, nombres, apellidos, plan_id, email_verificado, estado_suscripcion),
            lider:lider_id (
                nombre,
                user_id,
                users:user_id (nombres, apellidos)
            )
        `)
        .in('lider_id', subLeaderIds)
        .order('fecha_registro', { ascending: false });
        
    if (error) {
        console.error('[Referral] Error Step 4 (Level 2 Users):', error);
        return [];
    }

    console.log('[Referral] Step 4 OK. Found Level 2 users:', data?.length || 0);

    return (data || []).map((r: any) => ({
        id: r.usuario_id,
        email: r.users?.email || 'Usuario oculto',
        nombres: r.users?.nombres,
        apellidos: r.users?.apellidos,
        planId: r.users?.plan_id,
        emailVerificado: r.users?.email_verificado,
        estadoSuscripcion: r.users?.estado_suscripcion,
        referenteDe: r.lider?.nombre || (r.lider?.users ? `${r.lider.users.nombres || ''} ${r.lider.users.apellidos || ''}`.trim() : 'Referente'),
        createdAt: r.fecha_registro
    }));
}

/**
 * Busca el nombre completo de un referente por su código. Usa RPC para bypass de RLS.
 */
export async function getReferrerNameByCode(code: string): Promise<string | null> {
    if (!code) return null;
    
    try {
        const { data, error } = await supabase
            .rpc('get_referrer_info', { ref_code: code });

        if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
        
        // La rpc devuelve un array de objetos
        const info = Array.isArray(data) ? data[0] : data;
        if (!info || (!info.nombres && !info.apellidos)) return null;
        
        return `${info.nombres || ''} ${info.apellidos || ''}`.trim();
    } catch (err) {
        console.error('Error fetching referrer name:', err);
        return null;
    }
}

/**
 * Estadísticas para el panel de administración
 */
export async function getAdminReferralStats(): Promise<any> {
    try {
        const [configRes, usersRes, leaderStatsRes, withdrawalsRes] = await Promise.all([
            supabase.from('sistema_referidos_config').select('*').order('fecha_actualizacion', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('referidos_usuarios').select('id', { count: 'exact', head: true }),
            supabase.from('referidos_lideres').select('total_comisiones_generadas'),
            supabase.from('wallet_transactions' as any).select('amount').eq('type', 'withdrawal')
        ]);

        const totalReferred = usersRes.count || 0;
        
        // Contamos líderes reales (por rol)
        const { count: totalLeaders } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('rol', 'lider');

        // Dinero REAL ya pagado (retiros completados)
        const totalPaid = (withdrawalsRes.data as any[] || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        
        // Dinero que los usuarios tienen en su billetera (Deuda de DropCost)
        const { data: wallets } = await supabase.from('users').select('wallet_saldo').gt('wallet_saldo', 0);
        const totalPending = (wallets as any[] || []).reduce((acc: number, curr: any) => acc + (Number(curr.wallet_saldo) || 0), 0);

        return {
            totalReferred,
            totalLeaders: totalLeaders || 0,
            totalCommissionsPaid: totalPaid,
            totalCommissionsPending: totalPending,
            config: configRes.data
        };
    } catch (err) {
        console.error('Error fetching admin referral stats:', err);
        return {
            totalReferred: 0,
            totalLeaders: 0,
            totalCommissionsPaid: 0,
            totalCommissionsPending: 0
        };
    }
}

/**
 * Obtiene todos los usuarios referidos del sistema (para ADMIN).
 */
export async function getAllReferredUsers(): Promise<any[]> {
    const { data, error } = await supabase
        .from('referidos_usuarios')
        .select(`
            id,
            fecha_registro,
            usuario_id,
            users:usuario_id (email, nombres, apellidos, plan_id, email_verificado, estado_suscripcion),
            lider:lider_id (
                codigo_referido,
                user_id,
                users:user_id (nombres, apellidos, email)
            )
        `)
        .order('fecha_registro', { ascending: false });

    if (error) {
        console.error('Error fetching all referred users:', error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        email: r.users?.email || 'N/A',
        nombre: `${r.users?.nombres || ''} ${r.users?.apellidos || ''}`.trim() || 'Nuevo Usuario',
        planId: r.users?.plan_id,
        emailVerificado: r.users?.email_verificado,
        estadoSuscripcion: r.users?.estado_suscripcion,
        fechaRegistro: r.fecha_registro,
        referente: r.lider?.users ? `${r.lider.users.nombres || ''} ${r.lider.users.apellidos || ''}`.trim() : r.lider?.codigo_referido || 'N/A'
    }));
}

/**
 * Obtiene todos los líderes del sistema (para ADMIN).
 */
export async function getAllLeaders(): Promise<any[]> {
    const { data, error } = await supabase
        .from('referidos_lideres')
        .select(`
            id,
            codigo_referido,
            total_usuarios_referidos,
            total_comisiones_generadas,
            user_id,
            users:user_id (email, nombres, apellidos, rol)
        `)
        .order('total_usuarios_referidos', { ascending: false });

    if (error) {
        console.error('Error fetching all leaders:', error);
        return [];
    }

    return (data || []).map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        email: l.users?.email || 'N/A',
        nombre: `${l.users?.nombres || ''} ${l.users?.apellidos || ''}`.trim() || 'Líder',
        codigo: l.codigo_referido,
        totalReferidos: l.total_usuarios_referidos,
        totalComisiones: l.total_comisiones_generadas,
        rol: l.users?.rol
    }));
}
