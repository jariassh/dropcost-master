/**
 * Página de la Billetera Digital (Wallet).
 */
import React, { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Plus,
    MoreHorizontal,
    History,
    TrendingUp,
    Download,
    Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getWalletBalance, getWalletTransactions, WalletTransaction } from '@/services/walletService';
import { Spinner } from '@/components/common/Spinner';

export function WalletPage() {
    const { user } = useAuthStore();
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();
    const isFreePlan = user?.planId === 'plan_free' && user?.rol !== 'admin' && user?.rol !== 'superadmin';

    useEffect(() => {
        if (isFreePlan) return; // Don't load data if restricted

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [b, t] = await Promise.all([
                    getWalletBalance(),
                    getWalletTransactions()
                ]);
                setBalance(b);
                setTransactions(t);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [isFreePlan]);

    if (isFreePlan) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
                <div style={{
                    width: '80px', height: '80px', margin: '0 auto 24px',
                    borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f59e0b'
                }}>
                    <Lock size={40} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>Funcionalidad Premium</h1>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
                    El acceso a la Billetera Digital es exclusivo para nuestros miembros Pro y Enterprise.
                    <br />Gestiona tus ganancias y retiros actualizando tu plan.
                </p>
                <button
                    onClick={() => navigate('/pricing')}
                    style={{
                        padding: '14px 32px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.4)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Ver Planes Disponibles
                </button>
            </div>
        );
    }

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}><Spinner /></div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Tu Billetera
                </h1>
                <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                    Gestiona tus ganancias del sistema de referidos y solicita tus retiros.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', marginBottom: '32px' }}>
                {/* Main Content: Balance Card & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Tarjeta de Balance */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #004dc2 100%)',
                        color: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px -5px rgba(0, 102, 255, 0.4)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Balance Disponible</div>
                                    <div style={{ fontSize: '36px', fontWeight: 800 }}>${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '12px' }}>
                                    <Wallet size={24} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button style={{
                                    backgroundColor: '#fff', color: 'var(--color-primary)', border: 'none',
                                    padding: '12px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <ArrowUpRight size={18} />
                                    Solicitar Retiro
                                </button>
                                <button style={{
                                    backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '12px 24px', borderRadius: '14px', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer'
                                }}>
                                    Gestionar Bancos
                                </button>
                            </div>
                        </div>

                        {/* Decoration */}
                        <div style={{
                            position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px',
                            borderRadius: '50%', background: 'rgba(255,255,255,0.05)'
                        }} />
                        <div style={{
                            position: 'absolute', left: '-20px', bottom: '-40px', width: '120px', height: '120px',
                            borderRadius: '50%', background: 'rgba(255,255,255,0.03)'
                        }} />
                    </div>

                    {/* Historial de Movimientos */}
                    <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} color="var(--color-primary)" />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Actividad Reciente</h3>
                            </div>
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <Download size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {transactions.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                    Aún no hay movimientos en tu billetera.
                                </div>
                            ) : (
                                transactions.map(t => (
                                    <div key={t.id} style={{
                                        padding: '16px 24px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '12px',
                                                backgroundColor: t.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: t.type === 'withdrawal' ? 'var(--color-error)' : 'var(--color-success)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {t.type === 'withdrawal' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.description}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontWeight: 700,
                                            fontSize: '15px',
                                            color: t.type === 'withdrawal' ? 'var(--color-error)' : 'var(--color-success)'
                                        }}>
                                            {t.type === 'withdrawal' ? '-' : '+'}${t.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Infor & Bank Mock */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '20px', padding: '24px' }}>
                        <h4 style={{ margin: '0 0 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={18} /> Metodo de Pago
                        </h4>
                        <div style={{
                            padding: '16px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            border: '1px dashed var(--border-color)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>No has configurado una cuenta bancaria</div>
                            <button style={{
                                background: 'none', border: 'none', color: 'var(--color-primary)',
                                fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto'
                            }}>
                                <Plus size={14} /> Añadir Cuenta
                            </button>
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '20px',
                        padding: '24px',
                        color: '#92400e'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ marginTop: '2px' }}><TrendingUp size={20} /></div>
                            <div>
                                <h4 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '14px' }}>Potencial de Ganancia</h4>
                                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, opacity: 0.9 }}>
                                    Recuerda que recibes el 10% de cada renovación de tus referidos directos. ¡Sigue invitando!
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
