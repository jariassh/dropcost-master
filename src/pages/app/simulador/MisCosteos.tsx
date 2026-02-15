/**
 * MisCosteos - Tabla de costeos guardados con filtros y acciones.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, useToast, ConfirmDialog, Tooltip } from '@/components/common';
import type { SavedCosteo } from '@/types/simulator';
import { Trash2, Copy, ArrowLeft, Search, Calculator, BarChart3, Check, X, Pencil, Info, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function MisCosteos() {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuthStore();
    const [costeos, setCosteos] = useState<SavedCosteo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Inline editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Confirmation state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [linkedOfferId, setLinkedOfferId] = useState<string | null>(null);
    const [ofertas, setOfertas] = useState<any[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('dropcost_costeos');
        if (stored) {
            setCosteos(JSON.parse(stored));
        }

        const storedOfertas = localStorage.getItem('dropcost_ofertas');
        if (storedOfertas) {
            setOfertas(JSON.parse(storedOfertas));
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
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        // Free plan cannot duplicate (needs Pro or Enterprise)
        if (!isAdmin && user?.planId === 'plan_free') {
            toast.warning('Función Pro', 'Duplicar costeos está disponible desde el Plan Pro.');
            return;
        }

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

    function confirmDelete(id: string) {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        // Only Enterprise or Admin can delete
        if (!isAdmin && user?.planId !== 'plan_enterprise') {
            toast.warning('Función Enterprise', 'La eliminación de registros está reservada para el Plan Enterprise.');
            return;
        }

        const linkedOffer = ofertas.find(o => o.costeoId === id);
        if (linkedOffer) {
            setLinkedOfferId(linkedOffer.id);
        } else {
            setLinkedOfferId(null);
        }
        setItemToDelete(id);
        setConfirmOpen(true);
    }

    function handleDelete() {
        if (!itemToDelete) return;

        if (linkedOfferId) {
            // Can't delete, redirect instead
            setConfirmOpen(false);
            navigate(`/ofertas?id=${linkedOfferId}`);
            return;
        }

        const updated = costeos.filter((c) => c.id !== itemToDelete);
        setCosteos(updated);
        localStorage.setItem('dropcost_costeos', JSON.stringify(updated));
        toast.info('Costeo eliminado');
        setConfirmOpen(false);
        setItemToDelete(null);
    }

    function startEdit(costeo: SavedCosteo) {
        setEditingId(costeo.id);
        setEditValue(costeo.metaCampaignId || '');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditValue('');
    }

    function saveEdit(id: string) {
        const updated = costeos.map((c) => {
            if (c.id === id) {
                return { ...c, metaCampaignId: editValue.trim() || undefined, updatedAt: new Date().toISOString() };
            }
            return c;
        });
        setCosteos(updated);
        localStorage.setItem('dropcost_costeos', JSON.stringify(updated));
        toast.success('ID de campaña actualizado');
        cancelEdit();
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
                        overflowX: 'auto',
                    }}
                >
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '14px',
                            minWidth: '800px',
                        }}
                    >
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                {['Producto', 'ID Campaña', 'Precio Sugerido', 'Utilidad', 'Efectividad', 'Fecha', 'Acciones'].map(
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
                                    {/* Producto */}
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {c.productName}
                                            </span>
                                            {c.volumeStrategy && (
                                                <div
                                                    onClick={() => {
                                                        const off = ofertas.find(o => o.costeoId === c.id);
                                                        if (off) navigate(`/ofertas?id=${off.id}`);
                                                        else navigate('/ofertas');
                                                    }}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        fontSize: '11px', fontWeight: 600,
                                                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                                        color: '#fff',
                                                        padding: '2px 8px', borderRadius: '12px',
                                                        width: 'fit-content',
                                                        boxShadow: '0 2px 5px rgba(37,99,235,0.2)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <BarChart3 size={11} />
                                                    <span>Con tabla volumen</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* ID Campaña (Editable) */}
                                    <td style={{ padding: '14px 16px' }}>
                                        {editingId === c.id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    placeholder="ID..."
                                                    autoFocus
                                                    style={{
                                                        width: '100px',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--color-primary)',
                                                        outline: 'none',
                                                        fontSize: '13px',
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEdit(c.id);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                                <button
                                                    onClick={() => saveEdit(c.id)}
                                                    style={{
                                                        padding: '4px', borderRadius: '4px',
                                                        backgroundColor: 'var(--color-success)', color: '#fff',
                                                        border: 'none', cursor: 'pointer', display: 'flex'
                                                    }}
                                                    title="Guardar"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    style={{
                                                        padding: '4px', borderRadius: '4px',
                                                        backgroundColor: 'var(--text-tertiary)', color: '#fff',
                                                        border: 'none', cursor: 'pointer', display: 'flex'
                                                    }}
                                                    title="Cancelar"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {c.metaCampaignId ? (
                                                    <span style={{
                                                        fontFamily: 'monospace',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {c.metaCampaignId}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic' }}>
                                                        Sin asignar
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => startEdit(c)}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        color: 'var(--text-tertiary)', padding: '4px',
                                                        opacity: 0.6, transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                                    title="Editar ID Campaña"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    {/* Precio Sugerido */}
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                                                    {formatCurrency(c.results.suggestedPrice)}
                                                </span>
                                                {c.results.originalSuggestedPrice && Math.abs(c.results.originalSuggestedPrice - c.results.suggestedPrice) > 10 && (
                                                    <Tooltip content={`Sugerido por sistema: ${formatCurrency(c.results.originalSuggestedPrice)}`}>
                                                        <Info size={14} style={{ color: 'var(--text-tertiary)', cursor: 'help' }} />
                                                    </Tooltip>
                                                )}
                                            </div>
                                            {c.volumeStrategy && (
                                                <button
                                                    onClick={() => {
                                                        const off = ofertas.find(o => o.costeoId === c.id);
                                                        if (off) navigate(`/ofertas?id=${off.id}`);
                                                        else navigate('/ofertas');
                                                    }}
                                                    title="Ver detalles de oferta"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        width: '28px', height: '28px', borderRadius: '6px',
                                                        border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)',
                                                        cursor: 'pointer', color: 'var(--color-primary)',
                                                        transition: 'all 100ms',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                        e.currentTarget.style.backgroundColor = 'rgba(0,102,255,0.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                                                    }}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Utilidad */}
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            fontWeight: 700,
                                            fontSize: '15px',
                                            color: c.results.netProfitPerSale > 0 ? 'var(--color-success)' : 'var(--color-error)'
                                        }}>
                                            {formatCurrency(c.results.netProfitPerSale)}
                                        </span>
                                    </td>

                                    {/* Efectividad */}
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.results.finalEffectivenessPercent}%</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Entrega Final</span>
                                        </div>
                                    </td>

                                    {/* Fecha */}
                                    <td
                                        style={{
                                            padding: '14px 16px',
                                            color: 'var(--text-secondary)',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {formatDate(c.createdAt)}
                                    </td>

                                    {/* Acciones */}
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
                                                onClick={() => confirmDelete(c.id)}
                                                danger
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title={linkedOfferId ? 'Costeo vinculado a oferta' : 'Eliminar Costeo'}
                description={
                    linkedOfferId
                        ? 'Este costeo está vinculado a una oferta activa. Debes eliminar primero la oferta para poder borrar el costeo.'
                        : '¿Estás seguro de que deseas eliminar este costeo permanentemente? Esta acción no se puede deshacer.'
                }
                confirmLabel={linkedOfferId ? 'Ver Oferta' : 'Sí, eliminar'}
                variant={linkedOfferId ? 'info' : 'danger'}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
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
