/**
 * Componente para seleccionar y gestionar tiendas en el sidebar.
 */
import { useState, useEffect } from 'react';
import { Store, Plus, ChevronDown, Check } from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { CreateStoreModal } from './CreateStoreModal';

interface StoreSelectorProps {
    collapsed: boolean;
}

export function StoreSelector({ collapsed }: StoreSelectorProps) {
    const { tiendas, tiendaActual, setTiendaActual, fetchTiendas, isLoading } = useStoreStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchTiendas();
    }, [fetchTiendas]);

    if (isLoading && tiendas.length === 0) {
        return (
            <div style={{ padding: '0 16px', marginBottom: '20px' }}>
                <div style={{ height: '44px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ padding: collapsed ? '0 12px' : '0 12px', marginBottom: '16px', position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Store size={14} color="#fff" />
                    </div>
                    {!collapsed && (
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {tiendaActual?.nombre || 'Seleccionar Tienda'}
                        </span>
                    )}
                </div>
                {!collapsed && <ChevronDown size={14} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />}
            </button>

            {/* Dropdown de Tiendas */}
            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: collapsed ? 'calc(100% + 10px)' : '12px',
                        right: collapsed ? 'auto' : '12px',
                        width: collapsed ? '220px' : 'auto',
                        marginTop: '8px',
                        backgroundColor: '#1E1E1E',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        padding: '6px',
                        zIndex: 60,
                        animation: 'fadeIn 150ms ease-out',
                    }}>
                        <p style={{ margin: '8px 12px 12px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Mis Tiendas
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '240px', overflowY: 'auto' }}>
                            {tiendas.map((tienda) => (
                                <button
                                    key={tienda.id}
                                    onClick={() => {
                                        setTiendaActual(tienda);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        backgroundColor: tiendaActual?.id === tienda.id ? 'rgba(0,102,255,0.1)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: tiendaActual?.id === tienda.id ? 'var(--color-primary)' : '#fff',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background-color 150ms',
                                    }}
                                    onMouseEnter={(e) => { if (tiendaActual?.id !== tienda.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                                    onMouseLeave={(e) => { if (tiendaActual?.id !== tienda.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{tienda.nombre}</span>
                                    {tiendaActual?.id === tienda.id && <Check size={14} />}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsCreateModalOpen(true);
                                }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    transition: 'all 150ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            >
                                <Plus size={14} />
                                <span>Nueva Tienda</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            <CreateStoreModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
