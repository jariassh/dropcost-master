import React, { useState, useEffect } from 'react';
import {
    Wallet,
    TrendingUp,
    ArrowUpRight,
    History,
    Plus,
    Search,
    Download,
    Eye,
    ChevronRight,
    LucideIcon,
    Landmark,
    X
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { useToast } from '@/components/common/Toast';
import { StatsCard } from '@/components/common/StatsCard';
import { walletService, WalletBalance, WalletMovement, WithdrawalRequest } from '@/services/walletService';
import { formatCurrency } from '@/lib/format';
import { fetchExchangeRates, convertPrice } from '@/utils/currencyUtils';
import { useAuthStore } from '@/store/authStore';
import { WithdrawalModal } from '@/components/referidos/WithdrawalModal';
import { supabase } from '@/lib/supabase';

export const WalletPage: React.FC = () => {
    const { user, initialize } = useAuthStore();
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [movements, setMovements] = useState<WalletMovement[]>([]);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [bankInfo, setBankInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
    const [displayCurrency, setDisplayCurrency] = useState<string>('COP');
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isBankEditOpen, setIsBankEditOpen] = useState(false);
    const [minimumWithdrawal, setMinimumWithdrawal] = useState<number>(10);
    const [retentionDays, setRetentionDays] = useState<number>(30);
    const toast = useToast();

    const loadData = async () => {
        try {
            // 1. Cargar balances, movimientos, configuración e info bancaria
            const [balanceData, movementsData, withdrawalsData, rates, minWithdrawal] = await Promise.all([
                walletService.getBalance(),
                walletService.getMovements(),
                walletService.getWithdrawals(),
                fetchExchangeRates('USD'),
                walletService.getMinimumWithdrawal()
            ]);

            // 2. Obtener días de retención desde la configuración
            const { data: config } = await supabase
                .from('sistema_referidos_config' as any)
                .select('dias_retencion_comision')
                .order('fecha_actualizacion', { ascending: false })
                .limit(1)
                .maybeSingle();

            // 3. Cargar bank_info: primero desde users, luego fallback desde retiro más reciente
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: userProfile } = await supabase
                    .from('users' as any)
                    .select('bank_info')
                    .eq('id', authUser.id)
                    .maybeSingle();

                const profileBankInfo = (userProfile as any)?.bank_info;

                if (profileBankInfo && profileBankInfo.banco_nombre) {
                    setBankInfo(profileBankInfo);
                } else {
                    // Fallback: usar datos del retiro más reciente
                    const { data: lastWithdrawal } = await supabase
                        .from('retiros_referidos' as any)
                        .select('banco_nombre, cuenta_numero, cuenta_tipo, titular_nombre, documento_id')
                        .eq('user_id', authUser.id)
                        .order('fecha_solicitud', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (lastWithdrawal && (lastWithdrawal as any).banco_nombre) {
                        setBankInfo({
                            banco_nombre: (lastWithdrawal as any).banco_nombre,
                            cuenta_numero: (lastWithdrawal as any).cuenta_numero,
                            cuenta_tipo: (lastWithdrawal as any).cuenta_tipo,
                            titular_nombre: (lastWithdrawal as any).titular_nombre,
                            documento_id: (lastWithdrawal as any).documento_id,
                        });
                    }
                }
            }

            const days = config?.dias_retencion_comision ?? 30;

            setBalance(balanceData);
            setMovements(movementsData);
            setWithdrawals(withdrawalsData);
            setExchangeRates(rates);
            setMinimumWithdrawal(minWithdrawal);
            setRetentionDays(days);

            // Determinar moneda de visualización
            if (user?.pais === 'MX') setDisplayCurrency('MXN');
            else if (user?.pais === 'EC') setDisplayCurrency('USD');
            else setDisplayCurrency('COP');

        } catch (error) {
            console.error('Error loading wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [user]);

    const getConverted = (amountUsd: number) => {
        if (!exchangeRates) return amountUsd;
        return convertPrice(amountUsd, displayCurrency, exchangeRates);
    };

    const handleWithdrawClick = () => {
        const available = balance?.available_balance || 0;

        if (available < minimumWithdrawal) {
            const minFormatted = displayCurrency === 'COP'
                ? `$ ${new Intl.NumberFormat('es-CO').format(Math.round(((exchangeRates?.['COP'] || 3950) * minimumWithdrawal) / 100) * 100)}`
                : formatCurrency(getConverted(minimumWithdrawal), displayCurrency);

            toast.error('Saldo Insuficiente', `El monto mínimo para retirar es ${minFormatted} (~${minimumWithdrawal} USD)`);
            return;
        }
        setIsWithdrawModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="dc-wallet-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '20px 0 60px 0' }}>
            {/* Header section */}
            <div className="dc-wallet-header">
                <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Mi Billetera</h1>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>Gestiona tus comisiones y solicita retiros de forma segura.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatsCard
                    title="Saldo Disponible"
                    value={getConverted(balance?.available_balance || 0)}
                    currency={displayCurrency}
                    icon={<Wallet size={24} />}
                    color="var(--color-primary)"
                    subtitle="Dinero listo para retirar"
                    action={
                        <Button
                            size="xs"
                            leftIcon={<Plus size={14} />}
                            onClick={handleWithdrawClick}
                        >
                            Retirar
                        </Button>
                    }
                />
                <StatsCard
                    title="Total Generado"
                    value={getConverted(balance?.total_earned || 0)}
                    currency={displayCurrency}
                    icon={<TrendingUp size={24} />}
                    color="var(--color-success)"
                    subtitle="Histórico de ganancias"
                />
                <StatsCard
                    title="En Revisión"
                    value={getConverted(balance?.pending_commissions || 0)}
                    currency={displayCurrency}
                    icon={<History size={24} />}
                    color="var(--color-warning)"
                    subtitle={`Comisiones pendientes (< ${retentionDays} días)`}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Movements Table */}
                <div className="xl:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Movimientos Recientes</h3>
                        <Card noPadding style={{ boxShadow: 'var(--shadow-lg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <div className="overflow-x-auto">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                            <th style={tableHeaderStyle}>Concepto</th>
                                            <th style={tableHeaderStyle}>Tipo</th>
                                            <th style={tableHeaderStyle}>Fecha</th>
                                            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                    No hay movimientos registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            movements.map((move) => (
                                                <tr
                                                    key={move.id}
                                                    style={tableRowStyle}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={tableCellStyle}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{move.description}</span>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <Badge variant={move.type === 'withdrawal' ? 'modern-error' : 'modern-success'}>
                                                            {move.type === 'referral_bonus' ? 'Comisión' :
                                                                move.type === 'withdrawal' ? 'Retiro' : 'Ajuste'}
                                                        </Badge>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                                            {new Date(move.created_at).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            color: move.type === 'withdrawal' ? 'var(--color-error)' : 'var(--color-success)'
                                                        }}>
                                                            {move.type === 'withdrawal' ? '-' : '+'}
                                                            {formatCurrency(getConverted(move.amount), displayCurrency)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Estado de Retiros</h3>
                        <Card noPadding style={{ boxShadow: 'var(--shadow-lg)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            <div className="overflow-x-auto">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                            <th style={tableHeaderStyle}>ID</th>
                                            <th style={tableHeaderStyle}>Monto Local</th>
                                            <th style={tableHeaderStyle}>Estado</th>
                                            <th style={tableHeaderStyle}>Banco</th>
                                            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {withdrawals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                    No has solicitado retiros aún.
                                                </td>
                                            </tr>
                                        ) : (
                                            withdrawals.map((req) => (
                                                <tr
                                                    key={req.id}
                                                    style={tableRowStyle}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={tableCellStyle}>
                                                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                                                            {req.id.split('-')[0]}...
                                                        </span>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                            {formatCurrency(req.monto_local, req.moneda_destino)}
                                                        </span>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <Badge variant={
                                                            req.estado === 'completado' ? 'modern-success' :
                                                                req.estado === 'en_proceso' ? 'pill-info' :
                                                                    req.estado === 'rechazado' ? 'modern-error' : 'pill-warning'
                                                        }>
                                                            {req.estado === 'completado' ? 'Completado' :
                                                                req.estado === 'en_proceso' ? 'En Proceso' :
                                                                    req.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                                                        </Badge>
                                                    </td>
                                                    <td style={tableCellStyle}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{req.banco_nombre}</span>
                                                    </td>
                                                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                                            {new Date(req.fecha_solicitud).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right: Actions and Bank Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>


                    <Card title="Información Bancaria" style={{ boxShadow: 'var(--shadow-sm)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Vincula tu cuenta para recibir tus pagos automáticamente.
                            </p>

                            {bankInfo?.banco_nombre ? (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    {/* Banco */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px', height: '40px',
                                                borderRadius: '10px',
                                                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                                color: 'var(--color-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Landmark size={20} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Banco</p>
                                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{bankInfo.banco_nombre}</p>
                                            </div>
                                        </div>
                                        {bankInfo.cuenta_tipo && (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '3px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                                                color: 'var(--color-primary)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em'
                                            }}>
                                                {bankInfo.cuenta_tipo}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {/* Cuenta */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cuenta</span>
                                            <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600 }}>
                                                •••• {bankInfo.cuenta_numero?.slice(-4) || '0000'}
                                            </span>
                                        </div>
                                        {/* Titular */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Titular</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{bankInfo.titular_nombre}</span>
                                        </div>
                                        {/* Documento */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Documento</span>
                                            <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 600 }}>
                                                •••• {bankInfo.documento_id?.slice(-4) || '0000'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '32px 20px',
                                    textAlign: 'center',
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: '16px',
                                    backgroundColor: 'var(--bg-secondary)'
                                }}>
                                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        No hay cuenta vinculada
                                    </p>
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                        Agrega una cuenta al solicitar tu primer retiro.
                                    </span>
                                </div>
                            )}

                            <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsBankEditOpen(true)}>
                                {bankInfo?.banco_nombre ? 'Cambiar cuenta' : 'Vincular cuenta'}
                            </Button>
                        </div>
                    </Card>

                    <Card title="Información de Wise" style={{ boxShadow: 'var(--shadow-sm)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                <div style={{ color: 'var(--color-primary)' }}><Eye size={18} /></div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    Los retiros se procesan todos los <strong>viernes</strong>.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                <div style={{ color: 'var(--color-primary)' }}><Download size={18} /></div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    Se aplica un cargo de gestión del <strong>3%</strong> por transferencia.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Withdraw Modal */}
            <WithdrawalModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                onSuccess={() => {
                    loadData();
                    initialize();
                }}
                availableBalanceUsd={balance?.available_balance || 0}
                exchangeRate={exchangeRates?.[displayCurrency] || 1}
                currency={displayCurrency}
                existingBankInfo={bankInfo}
                minimumWithdrawalUsd={minimumWithdrawal}
            />

            {/* Bank Edit Modal */}
            {isBankEditOpen && (
                <BankEditModal
                    currentBankInfo={bankInfo}
                    onClose={() => setIsBankEditOpen(false)}
                    onSaved={() => {
                        setIsBankEditOpen(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

/* Styles & Sub-components */

const BalanceCard: React.FC<{
    title: string;
    amount: number;
    currency: string;
    icon: LucideIcon;
    color: string;
    subtitle: string;
    action?: React.ReactNode;
}> = ({ title, amount, currency, icon: Icon, color, subtitle, action }) => (
    <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div style={{
                width: '44px', height: '44px',
                backgroundColor: `${color}15`,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color
            }}>
                <Icon size={24} />
            </div>

            {action ? (
                <div>
                    {action}
                </div>
            ) : (
                <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase'
                }}>
                    {currency}
                </div>
            )}
        </div>
        <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</p>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {formatCurrency(amount, currency)}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{subtitle}</p>
        </div>
    </div>
);

const tableHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const tableCellStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '14px'
};

const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background-color 0.2s'
};

/* ─── Bank Edit Modal ─────────────────────────────────────────────────────── */

const BankEditModal: React.FC<{
    currentBankInfo: any;
    onClose: () => void;
    onSaved: () => void;
}> = ({ currentBankInfo, onClose, onSaved }) => {
    const toast = useToast();
    const [form, setForm] = React.useState({
        banco_nombre: currentBankInfo?.banco_nombre || '',
        cuenta_numero: currentBankInfo?.cuenta_numero || '',
        cuenta_tipo: currentBankInfo?.cuenta_tipo || 'Ahorros',
        titular_nombre: currentBankInfo?.titular_nombre || '',
        documento_id: currentBankInfo?.documento_id || '',
    });
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSave = async () => {
        if (!form.banco_nombre || !form.cuenta_numero || !form.titular_nombre || !form.documento_id) {
            setError('Por favor completa todos los campos');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await walletService.saveDefaultBankInfo(form);
            toast.success('Cuenta actualizada', 'Los datos bancarios se guardaron correctamente.');
            onSaved();
        } catch (err: any) {
            const msg = err.message || 'Error al guardar la información bancaria';
            setError(msg);
            toast.error('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    // Formatea número con separadores de miles (es-CO)
    const formatDoc = (raw: string) => {
        const digits = raw.replace(/\D/g, '');
        if (!digits) return '';
        return new Intl.NumberFormat('es-CO').format(Number(digits));
    };

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        setForm({ ...form, documento_id: digits });
    };

    const field = (label: string, key: keyof typeof form, placeholder: string) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {label}
            </label>
            <input
                type="text"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
        </div>
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                width: '100%', maxWidth: '460px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            backgroundColor: 'rgba(0,102,255,0.1)', color: 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Landmark size={20} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                            {currentBankInfo?.banco_nombre ? 'Cambiar Cuenta Bancaria' : 'Vincular Cuenta Bancaria'}
                        </h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {field('Banco', 'banco_nombre', 'Ej: Bancolombia')}
                        {field('Tipo de Cuenta', 'cuenta_tipo', 'Ahorros / Corriente')}
                    </div>
                    {field('Número de Cuenta', 'cuenta_numero', '000-000000-00')}
                    {field('Nombre del Titular', 'titular_nombre', 'Nombre completo')}

                    {/* Documento con formato miles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Documento de Identidad
                        </label>
                        <input
                            type="text"
                            value={formatDoc(form.documento_id)}
                            onChange={handleDocChange}
                            placeholder="9.999.999.999"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                    </div>

                    {error && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-error)', fontSize: '13px' }}>
                            <span>⚠ {error}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} isLoading={saving}>Guardar Cuenta</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
