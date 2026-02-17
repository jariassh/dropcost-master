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
    Download
} from 'lucide-react';
import { Spinner } from '@/components/common/Spinner';
import { useToast } from '@/components/common/Toast';
import { walletService, WithdrawalRequest } from '@/services/walletService';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { fetchExchangeRates, convertPrice, getDisplayCurrency } from '@/utils/currencyUtils';
import { obtenerPaisPorCodigo } from '@/services/paisesService';

export const AdminWithdrawalsPage: React.FC = () => {
    const { user } = useAuthStore();
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'pendiente' | 'completado' | 'rechazado'>('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
    const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
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
                .select('id, email, nombres, apellidos')
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
                    icon={Clock}
                    color="var(--color-warning)"
                    bgColor="rgba(245, 158, 11, 0.1)"
                />
                <StatsCard
                    title="Monto Pendiente"
                    value={formatCurrency(stats.pendingAmount, displayCurrency)}
                    icon={DollarSign}
                    color="var(--color-primary)"
                    bgColor="rgba(0, 102, 255, 0.1)"
                />
                <StatsCard
                    title="Total Pagado"
                    value={formatCurrency(stats.totalAmount, displayCurrency)}
                    icon={TrendingUp}
                    color="var(--color-success)"
                    bgColor="rgba(16, 185, 129, 0.1)"
                />
            </div>

            {/* Main Card */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
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
                                <th style={tableHeaderStyle}>Monto Local</th>
                                <th style={tableHeaderStyle}>Monto ({displayCurrency})</th>
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
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={tableCellStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    fontWeight: 700
                                                }}>
                                                    {((w as any).users?.nombres?.charAt(0) || '') + ((w as any).users?.apellidos?.charAt(0) || 'U')}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {(w as any).users?.nombres} {(w as any).users?.apellidos}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                        {(w as any).users?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                                            {formatCurrency(w.monto_local, w.moneda_destino)}
                                        </td>
                                        <td style={{ ...tableCellStyle, color: 'var(--text-secondary)' }}>
                                            {formatCurrency(getConverted(w.monto_usd), displayCurrency)}
                                        </td>
                                        <td style={tableCellStyle}>
                                            <div style={{ fontSize: '13px' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
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
                                                            onClick={() => {
                                                                const reason = prompt('Motivo del rechazo:');
                                                                if (reason) handleUpdateStatus(w.id, 'rechazado', reason);
                                                            }}
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
            </div>
        </div>
    );
};

const StatsCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
}> = ({ title, value, icon: Icon, color, bgColor }) => (
    <div style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
    }}>
        <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0
        }}>
            <Icon size={28} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
            }}>
                {title}
            </p>
            <p style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0
            }}>
                {value}
            </p>
        </div>
    </div>
);

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
            fontWeight: 700,
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
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const tableCellStyle: React.CSSProperties = {
    padding: '16px 20px',
    fontSize: '14px',
    color: 'var(--text-primary)'
};
