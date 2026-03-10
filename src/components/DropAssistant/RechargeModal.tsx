import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { CreditCard, DollarSign, Zap, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import { fetchExchangeRates } from '@/utils/currencyUtils';
import { useTheme } from '@/hooks/useTheme';

interface RechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newBalance: number) => void;
}

export function RechargeModal({ isOpen, onClose, onSuccess }: RechargeModalProps) {
    const { user } = useAuthStore();
    const { isDark } = useTheme();
    const toast = useToast();
    const [amount, setAmount] = useState<string>('5');
    const [loading, setLoading] = useState(false);

    const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
    const credits = Math.floor(Number(amount || 0) / 0.05);

    const handleRecharge = async () => {
        const numAmount = Number(amount);
        if (!amount || numAmount < 5) {
            toast.error('Monto insuficiente', 'La recarga mínima es de $5.00 USD');
            return;
        }

        setLoading(true);
        try {
            if (isAdmin) {
                const result = await paymentService.adminDirectRecharge(user!.id, credits);
                toast.success('¡Recarga exitosa!', `Se han sumado ${credits} CR a tu cuenta.`);
                if (result.newBalance !== undefined) {
                    onSuccess(result.newBalance);
                }
                onClose();
            } else {
                // Calcular COP para enviar a Mercado Pago (mandatorio para cuenta Colombia)
                let amountCOP = 0;
                try {
                    const freshRates = await fetchExchangeRates('USD');
                    const rate = freshRates?.['COP'] || 4000;
                    amountCOP = Math.round(numAmount * rate);
                } catch (e) {
                    amountCOP = numAmount * 4000;
                }

                const initPoint = await paymentService.createCreditRechargeSession(numAmount, credits, amountCOP);
                window.location.href = initPoint;
            }
        } catch (error: any) {
            console.error('Error in recharge:', error);
            toast.error('Error', error.message || 'Error al procesar la recarga');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
                        <CreditCard size={20} color="#6366F1" />
                    </div>
                    <span style={{ fontWeight: 700 }}>Recargar DropCredits</span>
                </div>
            }
            size="sm"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', width: '100%', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Monto a recargar (USD)</span>
                        {isAdmin && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <ShieldCheck size={12} /> Admin
                            </span>
                        )}
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: '0', color: 'var(--text-tertiary)' }}>
                            <DollarSign size={20} />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid #6366F1',
                                padding: '12px 12px 12px 28px',
                                fontSize: '24px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                            placeholder="5.00"
                            min="5"
                        />
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '8px',
                            backgroundColor: isDark ? 'var(--bg-primary)' : '#FFFFFF',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            color: '#6366F1'
                        }}>
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: isDark ? '#A5B4FC' : '#6366F1', fontWeight: 600, margin: 0 }}>Recibirás</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: isDark ? '#E0E7FF' : '#312E81', margin: 0 }}>{credits} DropCredits</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '10px', color: isDark ? '#818CF8' : '#6366F1', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Valor CR</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#C7D2FE' : '#4F46E5', margin: 0 }}>$0.05 USD</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                        onClick={handleRecharge}
                        fullWidth
                        size="lg"
                        style={{ padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
                        isLoading={loading}
                        rightIcon={isAdmin ? <Zap size={18} /> : <ArrowRight size={18} />}
                    >
                        {isAdmin ? 'Recargar Instantáneamente' : 'Pagar con Mercado Pago'}
                    </Button>
                    <p style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-tertiary)', margin: 0, padding: '0 16px', lineHeight: '1.4' }}>
                        {isAdmin
                            ? "Como administrador, los créditos se sumarán directamente a tu cuenta sin pasar por la pasarela de pago."
                            : "Al hacer clic, serás redirigido a la pasarela segura de Mercado Pago para completar tu compra."}
                    </p>
                </div>
            </div>
        </Modal>
    );
}
