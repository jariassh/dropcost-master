import { supabase } from '@/lib/supabase';

export interface WalletBalance {
    total_earned: number;
    available_balance: number;
    pending_commissions: number;
}

export interface WalletMovement {
    id: string;
    type: 'referral_bonus' | 'withdrawal' | 'adjustment';
    amount: number;
    description: string;
    created_at: string;
}

export interface WithdrawalRequest {
    id: string;
    monto_usd: number;
    monto_local: number;
    moneda_destino: string;
    tasa_cambio: number;
    estado: 'pendiente' | 'en_proceso' | 'completado' | 'rechazado';
    banco_nombre: string;
    cuenta_numero: string;
    cuenta_tipo: string;
    titular_nombre: string;
    documento_id: string;
    fecha_solicitud: string;
}

export const walletService = {
    /**
     * Obtiene el balance de la wallet del usuario actual
     */
    async getBalance(): Promise<WalletBalance> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user authenticated');

        // 1. Obtener configuración de días de retención
        const { data: config } = await supabase
            .from('sistema_referidos_config')
            .select('dias_retencion_comision')
            .order('fecha_actualizacion', { ascending: false })
            .limit(1)
            .maybeSingle();

        const retentionDays = config?.dias_retencion_comision ?? 30;

        // 2. Calcular fecha límite para comisiones disponibles
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() - retentionDays);

        // 3. Obtener todas las transacciones de tipo referral_bonus
        const { data: movements, error: movementsError } = await supabase
            .from('wallet_transactions' as any)
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'referral_bonus') as any;

        if (movementsError) throw movementsError;

        const movementsArray = (movements || []) as any[];
        
        // Total generado (todas las comisiones históricas)
        const total_earned = movementsArray.reduce((acc, m) => acc + Number(m.amount || 0), 0);
        
        // Comisiones en revisión (< días de retención)
        const pending_commissions = movementsArray
            .filter(m => {
                const createdDate = new Date(m.created_at);
                return !isNaN(createdDate.getTime()) && createdDate > retentionDate;
            })
            .reduce((acc, m) => acc + Number(m.amount || 0), 0);

        // 4. Obtener retiros pendientes, en proceso o completados (no rechazados)
        const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('retiros_referidos' as any)
            .select('monto_usd, estado')
            .eq('user_id', user.id)
            .neq('estado', 'rechazado');

        if (withdrawalsError) throw withdrawalsError;

        const total_withdrawals = (withdrawals || []).reduce((acc: number, w: any) => acc + Number(w.monto_usd || 0), 0);

        // Saldo disponible (>= días de retención) - Retiros
        const gross_available = movementsArray
            .filter(m => {
                const createdDate = new Date(m.created_at);
                return !isNaN(createdDate.getTime()) && createdDate <= retentionDate;
            })
            .reduce((acc, m) => acc + Number(m.amount || 0), 0);

        const available_balance = Math.max(0, gross_available - total_withdrawals);

        return {
            available_balance: available_balance,
            total_earned: total_earned,
            pending_commissions: pending_commissions
        };
    },

    /**
     * Obtiene el historial de movimientos (wallet_transactions)
     */
    async getMovements(): Promise<WalletMovement[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user authenticated');

        const { data, error } = await supabase
            .from('wallet_transactions' as any)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as unknown) as WalletMovement[];
    },

    /**
     * Obtiene las solicitudes de retiro del usuario
     */
    async getWithdrawals(): Promise<WithdrawalRequest[]> {
        const { data, error } = await supabase
            .from('retiros_referidos' as any)
            .select('*')
            .order('fecha_solicitud', { ascending: false });

        if (error) throw error;
        return (data as unknown) as WithdrawalRequest[];
    },

    /**
     * Crea una nueva solicitud de retiro
     */
    async requestWithdrawal(params: {
        monto_usd: number;
        monto_local: number;
        moneda_destino: string;
        tasa_cambio: number;
        bank_info: {
            banco_nombre: string;
            cuenta_numero: string;
            cuenta_tipo: string;
            documento_id: string;
            titular_nombre: string;
        }
    }): Promise<WithdrawalRequest> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user authenticated');

        // Validar saldo suficiente (doble check en frontend)
        const balance = await this.getBalance();
        if (params.monto_usd > balance.available_balance) {
            throw new Error('Saldo insuficiente para realizar este retiro');
        }

        const { data, error } = await supabase
            .from('retiros_referidos' as any)
            .insert([{
                user_id: user.id,
                monto_usd: params.monto_usd,
                monto_local: params.monto_local,
                moneda_destino: params.moneda_destino,
                tasa_cambio: params.tasa_cambio,
                banco_nombre: params.bank_info.banco_nombre,
                cuenta_numero: params.bank_info.cuenta_numero,
                cuenta_tipo: params.bank_info.cuenta_tipo,
                documento_id: params.bank_info.documento_id,
                titular_nombre: params.bank_info.titular_nombre,
                estado: 'pendiente'
            } as any])
            .select()
            .single();

        if (error) throw error;

        // Opcional: Descontar saldo inmediatamente o esperar a aprobación?
        // Según el flujo estándar, se descuenta cuando se aprueba o se bloquea el saldo.
        // Por ahora solo creamos la solicitud.

        return (data as unknown) as WithdrawalRequest;
    },

    /**
     * Guarda o actualiza la información bancaria por defecto del usuario
     */
    async saveDefaultBankInfo(bankInfo: any): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user authenticated');

        const { error } = await supabase
            .from('users')
            .update({ bank_info: bankInfo } as any)
            .eq('id', user.id);

        if (error) throw error;
    },

    /**
     * Obtiene el monto mínimo de retiro en USD desde la configuración
     */
    async getMinimumWithdrawal(): Promise<number> {
        const { data: config } = await supabase
            .from('sistema_referidos_config' as any)
            .select('monto_minimo_retiro_usd')
            .order('fecha_actualizacion', { ascending: false })
            .limit(1)
            .maybeSingle();

        return config?.monto_minimo_retiro_usd ?? 10.00;
    }
};
