/**
 * MisCosteos - Tabla de costeos guardados con filtros y acciones.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, EmptyState, useToast } from '@/components/common';
import type { SavedCosteo } from '@/types/simulator';
import { ArrowLeft, Search, Trash2, Copy, Calculator, BarChart3 } from 'lucide-react';

export function MisCosteos() {
    const navigate = useNavigate();
    const toast = useToast();
    const [costeos, setCosteos] = useState<SavedCosteo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('dropcost_costeos');
        if (stored) {
            setCosteos(JSON.parse(stored));
        }
    }, []);

    const filteredCosteos = costeos.filter((c) =>
        c.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (val: number) =>
        '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

    function handleDuplicate(costeo: SavedCosteo) {
        const dup: SavedCosteo = {
            ...costeo,
            id: crypto.randomUUID(),
            productName: `${costeo.productName} (copia)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const updated = [dup, ...costeos];
        setCosteos(updated);
        localStorage.setItem('dropcost_costeos', JSON.stringify(updated));
        toast.success('Costeo duplicado');
    }

    function handleDelete(id: string) {
        const updated = costeos.filter((c) => c.id !== id);
        setCosteos(updated);
        localStorage.setItem('dropcost_costeos', JSON.stringify(updated));
        toast.info('Costeo eliminado');
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/simulador')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--card-bg)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                    }}
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Mis Costeos
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {costeos.length} costeo{costeos.length !== 1 ? 's' : ''} guardado{costeos.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
                <Search
                    size={16}
                    style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)',
                    }}
                />
                <input
                    type="text"
                    placeholder="Buscar por nombre de producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        fontSize: '14px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Empty state */}
            {filteredCosteos.length === 0 && (
                <EmptyState
                    icon={<Calculator size={48} />}
                    title={searchQuery ? 'Sin resultados' : 'Aún no tienes costeos'}
                    description={
                        searchQuery
                            ? `No se encontraron costeos con "${searchQuery}"`
                            : 'Usa el simulador para calcular tu primer precio y guárdalo aquí'
                    }
                    action={
                        searchQuery
                            ? undefined
                            : { label: 'Ir al Simulador', onClick: () => navigate('/simulador') }
                    }
                />
            )}

            {/* Table */}
            {filteredCosteos.length > 0 && (
                <div
                    style={{
                        borderRadius: '12px',
                        border: '1px solid var(--card-border)',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ overflowX: 'auto' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '14px',
                            }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                    {['Producto', 'Precio Sugerido', 'Utilidad', 'Efectividad', 'Fecha', 'Acciones'].map(
                                        (col) => (
                                            <th
                                                key={col}
                                                style={{
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '12px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    borderBottom: '1px solid var(--border-color)',
                                                }}
                                            >
                                                {col}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCosteos.map((c) => (
                                    <tr
                                        key={c.id}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            transition: 'background 100ms',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor = 'transparent')
                                        }
                                    >
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {c.productName}
                                                </span>
                                                {c.volumeStrategy && (
                                                    <Badge variant="info">
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <BarChart3 size={10} /> Con tabla volumen
                                                        </span>
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                                            {formatCurrency(c.results.suggestedPrice)}
                                        </td>
                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                fontWeight: 600,
                                                color:
                                                    c.results.netProfitPerSale > 0
                                                        ? 'var(--color-success)'
                                                        : 'var(--color-error)',
                                            }}
                                        >
                                            {formatCurrency(c.results.netProfitPerSale)}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {c.results.finalEffectivenessPercent}%
                                        </td>
                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                color: 'var(--text-secondary)',
                                                fontSize: '13px',
                                            }}
                                        >
                                            {formatDate(c.createdAt)}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <ActionBtn
                                                    icon={<Copy size={14} />}
                                                    title="Duplicar"
                                                    onClick={() => handleDuplicate(c)}
                                                />
                                                <ActionBtn
                                                    icon={<Trash2 size={14} />}
                                                    title="Eliminar"
                                                    onClick={() => handleDelete(c.id)}
                                                    danger
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionBtn({
    icon,
    title,
    onClick,
    danger = false,
}: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                cursor: 'pointer',
                color: danger ? 'var(--color-error)' : 'var(--text-secondary)',
                transition: 'all 100ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = danger ? 'var(--color-error)' : 'var(--color-primary)';
                e.currentTarget.style.color = danger ? 'var(--color-error)' : 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = danger ? 'var(--color-error)' : 'var(--text-secondary)';
            }}
        >
            {icon}
        </button>
    );
}
