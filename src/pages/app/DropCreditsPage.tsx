import React, { useState, useEffect } from 'react';
import {
    CreditCard, Zap, TrendingUp, History, ShoppingCart,
    Brain, ArrowUpRight, ArrowDownRight, RotateCcw, Info
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Spinner } from '@/components/common/Spinner';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { RechargeModal } from '@/components/DropAssistant/RechargeModal';
import { formatDisplayDate } from '@/utils/dateUtils';

interface CreditTransaction {
    id: string;
    tipo: 'purchase' | 'usage' | 'refund';
    credits_amount: number;
    cost_usd: number | null;
    consultation_type: string | null;
    mercado_pago_transaction_id: string | null;
    notes: string | null;
    created_at: string | null;
}

interface CreditBalance {
    credits: number;
    total_spent_usd: number;
}

export const DropCreditsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [balance, setBalance] = useState<CreditBalance>({ credits: 0, total_spent_usd: 0 });
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [balanceRes, transRes] = await Promise.all([
                supabase
                    .from('user_credits')
                    .select('credits, total_spent_usd')
                    .eq('usuario_id', user.id)
                    .maybeSingle(),
                supabase
                    .from('credit_transactions')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50)
            ]);

            if (balanceRes.data) {
                setBalance({
                    credits: balanceRes.data.credits ?? 0,
                    total_spent_usd: Number(balanceRes.data.total_spent_usd ?? 0)
                });
            }
            setTransactions(transRes.data ?? []);
        } catch (err) {
            // Error silencioso, se muestra vacío
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    // Calcular estadísticas
    const totalPurchased = transactions
        .filter(t => t.tipo === 'purchase')
        .reduce((sum, t) => sum + t.credits_amount, 0);

    const totalUsed = transactions
        .filter(t => t.tipo === 'usage')
        .reduce((sum, t) => sum + t.credits_amount, 0);

    const getTransactionConfig = (tipo: string) => {
        switch (tipo) {
            case 'purchase':
                return {
                    label: 'Recarga',
                    icon: ArrowUpRight,
                    color: '#10B981',
                    sign: '+'
                };
            case 'usage':
                return {
                    label: 'Consumo',
                    icon: ArrowDownRight,
                    color: '#F59E0B',
                    sign: '-'
                };
            case 'refund':
                return {
                    label: 'Reembolso',
                    icon: RotateCcw,
                    color: '#6366F1',
                    sign: '+'
                };
            default:
                return {
                    label: tipo,
                    icon: Info,
                    color: '#6B7280',
                    sign: ''
                };
        }
    };

    const getConsultationLabel = (type: string | null) => {
        if (!type) return '';
        switch (type) {
            case 'rápida': return 'Rápida';
            case 'moderada': return 'Moderada';
            case 'research': return 'Research';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <PageHeader
                icon={CreditCard}
                title="DropCredits"
                description="Gestiona tus créditos para el asistente de IA (Drop Analyst)"
            />

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '20px'
            }}>
                {/* Saldo actual */}
                <Card style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.02))',
                    border: '1px solid rgba(99, 102, 241, 0.15)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0, fontWeight: 500 }}>
                                Saldo Disponible
                            </p>
                            <h2 style={{
                                fontSize: '36px', fontWeight: 800, margin: '8px 0 0 0',
                                color: '#6366F1', lineHeight: 1
                            }}>
                                {balance.credits}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                                DropCredits
                            </p>
                        </div>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Zap size={24} color="#6366F1" />
                        </div>
                    </div>
                    <button
                        onClick={() => setIsRechargeOpen(true)}
                        style={{
                            marginTop: '16px', width: '100%', padding: '10px',
                            backgroundColor: '#6366F1', color: 'white',
                            border: 'none', borderRadius: '10px', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4F46E5')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6366F1')}
                    >
                        Recargar Créditos
                    </button>
                </Card>

                {/* Total comprado */}
                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0, fontWeight: 500 }}>
                                Total Recargado
                            </p>
                            <h2 style={{
                                fontSize: '36px', fontWeight: 800, margin: '8px 0 0 0',
                                color: '#10B981', lineHeight: 1
                            }}>
                                {totalPurchased}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                                créditos comprados
                            </p>
                        </div>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingUp size={24} color="#10B981" />
                        </div>
                    </div>
                    <p style={{
                        marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)',
                        borderTop: '1px solid var(--border-color)', paddingTop: '12px'
                    }}>
                        Inversión total: <strong style={{ color: 'var(--text-primary)' }}>${balance.total_spent_usd.toFixed(2)} USD</strong>
                    </p>
                </Card>

                {/* Total consumido */}
                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0, fontWeight: 500 }}>
                                Total Consumido
                            </p>
                            <h2 style={{
                                fontSize: '36px', fontWeight: 800, margin: '8px 0 0 0',
                                color: '#F59E0B', lineHeight: 1
                            }}>
                                {totalUsed}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                                créditos utilizados
                            </p>
                        </div>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Brain size={24} color="#F59E0B" />
                        </div>
                    </div>
                    <p style={{
                        marginTop: '16px', fontSize: '12px', color: 'var(--text-tertiary)',
                        borderTop: '1px solid var(--border-color)', paddingTop: '12px'
                    }}>
                        En consultas con Drop Analyst
                    </p>
                </Card>
            </div>

            {/* Tabla de precios */}
            <Card style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <ShoppingCart size={18} color="var(--text-secondary)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Tabla de Precios
                    </h3>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '12px'
                }}>
                    {[
                        { label: 'Pensar', cost: 1, desc: 'Respuestas rápidas y directas', icon: <Zap size={16} />, color: '#10B981' },
                        { label: 'Analizar', cost: 4, desc: 'Análisis moderado con contexto', icon: <Brain size={16} />, color: '#F59E0B' },
                        { label: 'Pro', cost: 9, desc: 'Investigación profunda y detallada', icon: <TrendingUp size={16} />, color: '#6366F1' }
                    ].map(level => (
                        <div key={level.label} style={{
                            padding: '16px', borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    color: level.color, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', padding: '4px',
                                    backgroundColor: `${level.color}15`, borderRadius: '6px'
                                }}>
                                    {level.icon}
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                                    {level.label}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                {level.desc}
                            </p>
                            <div style={{
                                marginTop: 'auto', padding: '8px 12px', borderRadius: '8px',
                                backgroundColor: `${level.color}10`, textAlign: 'center'
                            }}>
                                <span style={{ fontSize: '20px', fontWeight: 800, color: level.color }}>
                                    {level.cost}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                                    CR / consulta
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    1 DropCredit = $0.05 USD · Recarga mínima: $5.00 USD (100 CR)
                </p>
            </Card>

            {/* Historial de transacciones */}
            <Card style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <History size={18} color="var(--text-secondary)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Historial de DropCredits
                    </h3>
                </div>

                {transactions.length === 0 ? (
                    <div style={{
                        padding: '48px 24px', textAlign: 'center',
                        borderRadius: '12px', backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <CreditCard size={40} color="var(--text-tertiary)" style={{ opacity: 0.4 }} />
                        <p style={{ color: 'var(--text-tertiary)', marginTop: '12px', fontSize: '14px' }}>
                            No tienes transacciones de créditos aún
                        </p>
                        <button
                            onClick={() => setIsRechargeOpen(true)}
                            style={{
                                marginTop: '12px', padding: '8px 20px',
                                backgroundColor: '#6366F1', color: 'white',
                                border: 'none', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600
                            }}
                        >
                            Hacer primera recarga
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
                            fontSize: '13px'
                        }}>
                            <thead>
                                <tr>
                                    {['TIPO', 'CRÉDITOS', 'NOTAS', 'FECHA'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', textAlign: 'left',
                                            fontSize: '10px', fontWeight: 700,
                                            color: 'var(--text-tertiary)',
                                            letterSpacing: '0.05em',
                                            borderBottom: '1px solid var(--border-color)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(txn => {
                                    const config = getTransactionConfig(txn.tipo);
                                    const Icon = config.icon;
                                    return (
                                        <tr key={txn.id} style={{
                                            transition: 'background-color 0.15s'
                                        }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <td style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--border-color)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '8px',
                                                        backgroundColor: `${config.color}15`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <Icon size={14} color={config.color} />
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {config.label}
                                                    </span>
                                                    {txn.consultation_type && (
                                                        <span style={{
                                                            fontSize: '10px', padding: '2px 8px',
                                                            borderRadius: '6px',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            color: 'var(--text-tertiary)',
                                                            fontWeight: 500
                                                        }}>
                                                            {getConsultationLabel(txn.consultation_type)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--border-color)',
                                                fontWeight: 700,
                                                color: config.color,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {config.sign}{txn.credits_amount} CR
                                                {txn.cost_usd != null && txn.cost_usd > 0 && (
                                                    <span style={{
                                                        marginLeft: '8px', fontSize: '11px',
                                                        color: 'var(--text-tertiary)', fontWeight: 400
                                                    }}>
                                                        (${txn.cost_usd} USD)
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--border-color)',
                                                color: 'var(--text-secondary)',
                                                maxWidth: '260px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {txn.notes || '—'}
                                            </td>
                                            <td style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--border-color)',
                                                color: 'var(--text-tertiary)',
                                                whiteSpace: 'nowrap',
                                                fontSize: '12px'
                                            }}>
                                                {txn.created_at ? formatDisplayDate(txn.created_at) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal de recarga */}
            <RechargeModal
                isOpen={isRechargeOpen}
                onClose={() => setIsRechargeOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
};

export default DropCreditsPage;
