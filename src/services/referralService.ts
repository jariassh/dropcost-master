/**
 * Servicio para el sistema de referidos.
 */
import { supabase } from '@/lib/supabase';

export interface ReferralStats {
    totalClicks: number;
    totalReferred: number;
    totalEarned: number;
    referralCode: string;
}

export interface ReferredUser {
    id: string;
    email: string;
    nombres?: string;
    apellidos?: string;
    status: 'pending' | 'completed';
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
    if (!user) return { totalClicks: 0, totalReferred: 0, totalEarned: 0, referralCode: '' };

    // 1. Obtener código y balance del usuario
    const { data: userData } = await supabase
        .from('users')
        .select('codigo_referido_personal, wallet_saldo')
        .eq('id', user.id)
        .single();
    
    // 2. Obtener estadísticas del líder (clicks, referidos totales)
    const { data: leaderStats } = await supabase
        .from('referidos_lideres')
        .select('total_clicks, total_usuarios_referidos')
        .eq('user_id', user.id) // Asumiendo que el usuario es el líder
        .single();

    return {
        totalClicks: leaderStats?.total_clicks || 0,
        totalReferred: leaderStats?.total_usuarios_referidos || 0,
        totalEarned: userData?.wallet_saldo || 0,
        referralCode: userData?.codigo_referido_personal || ''
    };
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
            users:usuario_id (email, nombres, apellidos),
            referidos_lideres!inner (user_id)
        `)
        .eq('referidos_lideres.user_id', user.id);

    if (error) {
        console.error('Error fetching referred users:', error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        email: r.users?.email || 'Usuario oculto',
        nombres: r.users?.nombres,
        apellidos: r.users?.apellidos,
        status: 'completed',
        createdAt: r.fecha_registro
    }));
}

/**
 * Busca el nombre completo de un referente por su código.
 */
export async function getReferrerNameByCode(code: string): Promise<string | null> {
    if (!code) return null;
    
    const { data, error } = await supabase
        .from('users')
        .select('nombres, apellidos')
        .ilike('codigo_referido_personal', code)
        .maybeSingle();

    if (error || !data) return null;
    return `${data.nombres} ${data.apellidos}`;
}
