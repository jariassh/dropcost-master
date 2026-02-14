/**
 * Servicio para el manejo de la Billetera Digital.
 */
import { supabase } from '@/lib/supabase';

export interface WalletTransaction {
    id: string;
    userId: string;
    type: 'referral_bonus' | 'withdrawal' | 'adjustment';
    amount: number;
    description: string;
    createdAt: string;
}

/**
 * Obtiene el balance actual del usuario.
 */
export async function getWalletBalance(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
        .from('users')
        .select('wallet_saldo')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching balance:', error);
        return 0;
    }

    return data.wallet_saldo || 0;
}

/**
 * Obtiene el historial de transacciones.
 * Nota: La tabla wallet_transactions debe crearse en Supabase.
 */
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase as any)
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.created_at
    }));
}
