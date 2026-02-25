import React, { useState, useEffect } from 'react';
import {
    Search,
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    DollarSign,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    Users,
    Download,
    Globe
} from 'lucide-react';
import { cargarPaises, Pais } from '@/services/paisesService';
import { Card } from '@/components/common/Card';
import { StatsCard } from '@/components/common/StatsCard';
import { Spinner } from '@/components/common/Spinner';
import { useToast } from '@/components/common/Toast';
import { walletService, WithdrawalRequest } from '@/services/walletService';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { fetchExchangeRates, convertPrice, getDisplayCurrency } from '@/utils/currencyUtils';
import { obtenerPaisPorCodigo } from '@/services/paisesService';
import { dispararTriggerEmail } from '@/utils/emailTrigger';

export const AdminWithdrawalsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'pendiente' | 'completado' | 'rechazado'>('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
    const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
    const [allCountries, setAllCountries] = useState<Pais[]>([]);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
    const [rejectTarget, setRejectTarget] = useState<WithdrawalRequest | null>(null);
    const toast = useToast();

    const loadWithdrawals = async () => {
        setLoading(true);
        try {
            // Obtener todos los retiros
            const { data: withdrawalsData, error: withdrawalsError } = await supabase
                .from('retiros_referidos' as any)
                .select('*')
                .order('fecha_solicitud', { ascending: false });

            if (withdrawalsError) throw withdrawalsError;

            // Obtener IDs únicos de usuarios
            const userIds = [...new Set(withdrawalsData?.map((w: any) => w.user_id) || [])];

            // Obtener datos de usuarios
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, email, nombres, apellidos, pais, avatar_url')
                .in('id', userIds);

            if (usersError) throw usersError;

            // Combinar datos
            const enrichedWithdrawals = (withdrawalsData || []).map((w: any) => ({
                ...w,
                users: usersData?.find((u: any) => u.id === w.user_id)
            }));

            setWithdrawals((enrichedWithdrawals as unknown) as WithdrawalRequest[]);
        } catch (error) {
            console.error('Error loading admin withdrawals:', error);
            toast.error('Error', 'No se pudo cargar la lista de retiros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            cargarPaises().then(setAllCountries);
            await loadWithdrawals();

            // Cargar tasas de cambio y determinar moneda del admin
            if (user?.pais) {
                const paisInfo = await obtenerPaisPorCodigo(user.pais);
                if (paisInfo) {
                    const currency = getDisplayCurrency(user.pais, paisInfo.moneda_codigo);
                    setDisplayCurrency(currency);
                    const rates = await fetchExchangeRates('USD');
                    setExchangeRates(rates);
                }
            }
        };
        init();
    }, [user]);

    const getConverted = (amountUsd: number) => {
        if (!exchangeRates || displayCurrency === 'USD') return amountUsd;
        return convertPrice(amountUsd, displayCurrency, exchangeRates);
    };

    const handleUpdateStatus = async (id: string, newStatus: string, reason?: string) => {
        try {
            const { error } = await supabase
                .from('retiros_referidos' as any)
                .update({
                    estado: newStatus,
                    nota_admin: reason,
                    fecha_pago: newStatus === 'completado' ? new Date().toISOString() : null
                } as any)
                .eq('id', id);

            if (error) throw error;

            // Disparar trigger de email según el nuevo estado
            const retiro = withdrawals.find(w => w.id === id) as any;
            if (retiro) {
                const userData = retiro.users;
                const datosBase = {
                    usuario_id: retiro.user_id || '',
                    usuario_nombre: userData ? `${userData.nombres || ''} ${userData.apellidos || ''}`.trim() : '',
                    usuario_email: userData?.email || '',
                    monto_pago: String(retiro.monto_usd || 0),
                    banco_nombre: retiro.banco_nombre || '',
                    numero_cuenta: retiro.numero_cuenta || '',
                };

                if (newStatus === 'aprobado') {
                    dispararTriggerEmail('PAGO_COMISIONES_APROBADO', {
                        ...datosBase,
                        fecha_aprobacion: new Date().toISOString().split('T')[0],
                    });
                }
            }

            toast.success('Éxito', `Retiro marcado como ${newStatus}`);
            loadWithdrawals();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error', 'No se pudo actualizar el estado del retiro');
        }
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        const matchesStatus = filter === 'todos' || w.estado === filter;
        const matchesSearch = searchTerm === '' ||
            (w as any).users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (w as any).users?.nombres?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Stats
    const stats = {
        pending: withdrawals.filter(w => w.estado === 'pendiente').length,
        totalAmount: getConverted(withdrawals.filter(w => w.estado === 'completado').reduce((acc, curr) => acc + curr.monto_usd, 0)),
        pendingAmount: getConverted(withdrawals.filter(w => w.estado === 'pendiente').reduce((acc, curr) => acc + curr.monto_usd, 0))
    };

    if (loading && withdrawals.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <Spinner />
            </div>
        );
    }

    return (
        <>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 20px' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Gestión de Retiros
                        </h1>
                        <p style={{ fontSize: '15px', color: 'var(--text-tertiary)' }}>
                            Supervisa y procesa las solicitudes de pago de los usuarios.
                        </p>
                    </div>
                    <button
                        onClick={loadWithdrawals}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        Actualizar
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <StatsCard
                        title="Solicitudes Pendientes"
                        value={stats.pending}
                        icon={<Clock size={28} />}
                        color="var(--color-warning)"
                    />
                    <StatsCard
                        title="Monto Pendiente"
                        value={stats.pendingAmount}
                        currency={displayCurrency}
                        icon={<DollarSign size={28} />}
                        color="var(--color-primary)"
                    />
                    <StatsCard
                        title="Total Pagado"
                        value={stats.totalAmount}
                        currency={displayCurrency}
                        icon={<TrendingUp size={28} />}
                        color="var(--color-success)"
                    />
                </div>

                {/* Main Card */}
                <Card noPadding style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    {/* Filters */}
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        {/* Search */}
                        <div style={{ position: 'relative', maxWidth: '400px' }}>
                            <Search
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-tertiary)'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Buscar por usuario o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 44px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {(['todos', 'pendiente', 'completado', 'rechazado'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: filter === s ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                        color: filter === s ? '#fff' : 'var(--text-secondary)'
                                    }}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    <th style={tableHeaderStyle}>Usuario</th>
                                    <th style={tableHeaderStyle}>Cantidad Solicitada</th>
                                    <th style={tableHeaderStyle}>Monto Debitado ({displayCurrency})</th>
                                    <th style={tableHeaderStyle}>Banco</th>
                                    <th style={tableHeaderStyle}>Estado</th>
                                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWithdrawals.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--text-tertiary)'
                                                }}>
                                                    <AlertCircle size={32} />
                                                </div>
                                                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    No se encontraron solicitudes
                                                </p>
                                                <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                                                    Intenta ajustar los filtros de búsqueda
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWithdrawals.map((w) => (
                                        <tr
                                            key={w.id}
                                            style={{
                                                borderBottom: '1px solid var(--border-color)',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={tableCellStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '12px',
                                                        background: (w as any).users?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        overflow: 'hidden'
                                                    }}>
                                                        {(w as any).users?.avatar_url ? (
                                                            <img
                                                                src={(w as any).users.avatar_url}
                                                                alt={`${(w as any).users?.nombres} ${(w as any).users?.apellidos}`}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <>{((w as any).users?.nombres?.charAt(0) || '') + ((w as any).users?.apellidos?.charAt(0) || 'U')}</>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                            {(w as any).users?.nombres} {(w as any).users?.apellidos}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {(w as any).users?.email}
                                                            {(w as any).users?.pais && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>•</span>
                                                                    <img
                                                                        src={`https://flagcdn.com/w40/${(w as any).users.pais.toLowerCase()}.png`}
                                                                        alt={(w as any).users.pais}
                                                                        style={{ width: '14px', height: '10px', borderRadius: '1px', objectFit: 'cover' }}
                                                                        title={allCountries.find(p => p.codigo_iso_2.toUpperCase() === (w as any).users.pais.toUpperCase())?.nombre_es || (w as any).users.pais}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ ...tableCellStyle, fontWeight: 500 }}>
                                                {formatCurrency(w.monto_local, w.moneda_destino)}
                                            </td>
                                            <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>
                                                {formatCurrency(getConverted(w.monto_usd), displayCurrency)}
                                            </td>
                                            <td style={tableCellStyle}>
                                                <div style={{ fontSize: '13px' }}>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                                        {w.banco_nombre}
                                                    </div>
                                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                                                        {w.cuenta_tipo} • {w.cuenta_numero}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tableCellStyle}>
                                                <StatusBadge status={w.estado} />
                                            </td>
                                            <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    {w.estado === 'pendiente' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(w.id, 'completado')}
                                                                title="Marcar como pagado"
                                                                style={{
                                                                    padding: '8px',
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    color: 'var(--color-success)',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectTarget(w)}
                                                                title="Rechazar retiro"
                                                                style={{
                                                                    padding: '8px',
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    color: '#EF4444',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedWithdrawal(w)}
                                                        title="Ver detalles"
                                                        style={{
                                                            padding: '8px',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            color: 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Reject Modal */}
            {rejectTarget && (
                <RejectModal
                    withdrawal={rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={(reason) => {
                        handleUpdateStatus(rejectTarget.id, 'rechazado', reason);
                        setRejectTarget(null);
                    }}
                />
            )}

            {/* Detail Modal */}
            {selectedWithdrawal && (
                <WithdrawalDetailModal
                    withdrawal={selectedWithdrawal}
                    onClose={() => setSelectedWithdrawal(null)}
                />
            )}
        </>
    );
};



const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
        pendiente: { label: 'Pendiente', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.1)' },
        completado: { label: 'Completado', color: 'var(--color-success)', bg: 'rgba(16, 185, 129, 0.1)' },
        rechazado: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
        en_proceso: { label: 'En Proceso', color: 'var(--color-primary)', bg: 'rgba(0, 102, 255, 0.1)' }
    }[status] || { label: status, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' };

    return (
        <span style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: config.bg,
            color: config.color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-block'
        }}>
            {config.label}
        </span>
    );
};

const tableHeaderStyle: React.CSSProperties = {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const tableCellStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '14px',
    color: 'var(--text-primary)'
};

/* ─── Reject Modal ───────────────────────────────────────────────────────────── */

const RejectModal: React.FC<{
    withdrawal: WithdrawalRequest;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}> = ({ withdrawal: w, onClose, onConfirm }) => {
    const [reason, setReason] = React.useState('');
    const [error, setError] = React.useState('');

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError('Por favor ingresa el motivo del rechazo');
            return;
        }
        onConfirm(reason.trim());
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                width: '100%', maxWidth: '440px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <XCircle size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Rechazar Retiro</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                            {(w as any).users?.nombres} {(w as any).users?.apellidos} · {formatCurrency(w.monto_local, w.moneda_destino)}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Motivo del rechazo
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(''); }}
                            placeholder="Ej: Datos bancarios incorrectos, cuenta no válida..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--bg-primary)',
                                border: `1px solid ${error ? '#EF4444' : 'var(--border-color)'}`,
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0,102,255,0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#EF4444' : 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        {error && <span style={{ fontSize: '12px', color: '#EF4444' }}>⚠ {error}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)', cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                                backgroundColor: '#EF4444', border: 'none',
                                color: '#fff', cursor: 'pointer'
                            }}
                        >
                            Rechazar Retiro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Withdrawal Detail Modal ───────────────────────────────────────────────── */

const WithdrawalDetailModal: React.FC<{
    withdrawal: WithdrawalRequest;
    onClose: () => void;
}> = ({ withdrawal: w, onClose }) => {
    const row = (label: string, value: React.ReactNode) => (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: '1px solid var(--border-color)'
        }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
        </div>
    );

    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
        pendiente: { label: 'Pendiente', color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)' },
        completado: { label: 'Completado', color: 'var(--color-success)', bg: 'rgba(16,185,129,0.1)' },
        rechazado: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
    };
    const sc = statusConfig[w.estado] || { label: w.estado, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                width: '100%', maxWidth: '520px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: (w as any).users?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '16px', fontWeight: 700,
                            overflow: 'hidden'
                        }}>
                            {(w as any).users?.avatar_url ? (
                                <img
                                    src={(w as any).users.avatar_url}
                                    alt={`${(w as any).users?.nombres} ${(w as any).users?.apellidos}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <>{((w as any).users?.nombres?.charAt(0) || '') + ((w as any).users?.apellidos?.charAt(0) || 'U')}</>
                            )}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                                {(w as any).users?.nombres} {(w as any).users?.apellidos}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                                {(w as any).users?.email}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                            backgroundColor: sc.bg, color: sc.color, textTransform: 'uppercase'
                        }}>{sc.label}</span>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}>
                            <XCircle size={22} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Montos */}
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Montos</p>
                        {row('Monto solicitado', formatCurrency(w.monto_local, w.moneda_destino))}
                        {row('Equivalente USD', `$${w.monto_usd?.toFixed(2)} USD`)}
                        {row('Tasa de cambio', `1 USD = ${w.tasa_cambio?.toFixed(2)} ${w.moneda_destino}`)}
                    </div>

                    {/* Banco */}
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Información Bancaria</p>
                        {row('Banco', w.banco_nombre)}
                        {row('Tipo de cuenta', w.cuenta_tipo)}
                        {row('Número de cuenta', w.cuenta_numero)}
                        {(w as any).titular_nombre && row('Titular', (w as any).titular_nombre)}
                        {(w as any).documento_id && row('Documento', (w as any).documento_id)}
                    </div>

                    {/* Fechas */}
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Fechas</p>
                        {row('Fecha solicitud', w.fecha_solicitud ? new Date(w.fecha_solicitud).toLocaleString('es-CO') : '—')}
                        {(w as any).fecha_pago && row('Fecha pago', new Date((w as any).fecha_pago).toLocaleString('es-CO'))}
                    </div>

                    {/* Nota admin */}
                    {(w as any).nota_admin && (
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>Nota del Administrador</p>
                            <div style={{
                                padding: '12px 16px', borderRadius: '10px',
                                backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                fontSize: '13px', color: 'var(--text-primary)'
                            }}>
                                {(w as any).nota_admin}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

