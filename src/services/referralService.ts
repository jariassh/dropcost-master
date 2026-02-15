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
    status: 'pending' | 'completed';
    createdAt: string;
}

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

    // 2. Contar referidos completados
    const { count } = await supabase
        .from('referidos_usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('lider_id', user.id); // Asumiendo que el usuario actúa como su propio lider o ajustando a la lógica de la DB

    // Mock de clicks por ahora ya que no hay tabla de analítica de links de referidos
    return {
        totalClicks: 124, // Mock
        totalReferred: count || 0,
        totalEarned: userData?.wallet_saldo || 0,
        referralCode: userData?.codigo_referido_personal || ''
    };
}

/**
 * Obtiene la lista de usuarios referidos.
 */
export async function getReferredUsers(): Promise<ReferredUser[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Esta query asume una relación donde referidos_usuarios mapea al invitado
    const { data, error } = await supabase
        .from('referidos_usuarios')
        .select('*, users!usuario_id(email)')
        .eq('lider_id', user.id);

    if (error) {
        console.error('Error fetching referred users:', error);
        return [];
    }

    return (data || []).map((r: any) => ({
        id: r.id,
        email: r.users?.email || 'Usuario oculto',
        status: 'completed', // Si está en esta tabla, está completado
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
        .eq('codigo_referido_personal', code)
        .maybeSingle();

    if (error || !data) return null;
    return `${data.nombres} ${data.apellidos}`;
}
