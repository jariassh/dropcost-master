export type ReferralStatus = 'activo' | 'pausado' | 'suspendido';
export type CommissionStatus = 'pendiente' | 'pagada' | 'rechazada';
export type WithdrawalStatus = 'solicitado' | 'procesado' | 'completado' | 'rechazado';

export interface ReferralLeader {
    id: string;
    nombre: string;
    email: string;
    codigo_referido: string;
    porcentaje_comision: number;
    estado: ReferralStatus;

    // Statistics
    total_usuarios_referidos: number;
    total_usuarios_activos: number;
    total_comisiones_generadas: number;
    total_comisiones_pagadas: number;

    // Banking Info
    cuenta_bancaria_numero?: string;
    cuenta_bancaria_banco?: string;
    cuenta_bancaria_titular?: string;
    cuenta_bancaria_pais?: string;
    cuenta_bancaria_verificada: boolean;

    fecha_creacion: string;
}

export interface ReferralCommission {
    id: string;
    lider_id: string;
    usuario_referido_id?: string;
    monto: number;
    estado: CommissionStatus;
    fecha_generacion: string;
    fecha_pago?: string;
}

export interface ReferralWallet {
    id: string;
    lider_id: string;
    saldo: number;
    saldo_retenido: number;
    total_generado: number;
}
