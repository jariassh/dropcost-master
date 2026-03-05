import React, { useState, useEffect } from 'react';
import { Store, Building2, Trash2, Plus, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { Button, ConfirmDialog, useToast } from '@/components/common';
import { CreateStoreModal } from '@/components/layout/CreateStoreModal';
import { cargarPaises, Pais } from '@/services/paisesService';

export function TiendasPage() {
    const { user } = useAuthStore();
    const { tiendas, fetchTiendas, eliminarTienda } = useStoreStore();
    const navigate = useNavigate();
    const toast = useToast();

    const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
    const [deleteTiendaConfirm, setDeleteTiendaConfirm] = useState<string | null>(null);
    const [storeToDeleteData, setStoreToDeleteData] = useState<{ hasData: boolean; costeoCount: number } | null>(null);
    const [allCountries, setAllCountries] = useState<Pais[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchTiendas();
        cargarPaises().then(setAllCountries);
    }, [fetchTiendas]);

    const handleConfirmDeleteTienda = (id: string) => {
        const allCosteos = JSON.parse(localStorage.getItem('dropcost_costeos') || '[]');
        const storeCosteos = allCosteos.filter((c: any) => c.storeId === id);

        if (storeCosteos.length > 0) {
            setStoreToDeleteData({ hasData: true, costeoCount: storeCosteos.length });
        } else {
            setStoreToDeleteData({ hasData: false, costeoCount: 0 });
        }
        setDeleteTiendaConfirm(id);
    };

    const executeDeleteTienda = async () => {
        if (!deleteTiendaConfirm) return;
        const success = await eliminarTienda(deleteTiendaConfirm);
        if (success) {
            toast.success('Tienda eliminada', 'La tienda ha sido borrada exitosamente.');
        } else {
            toast.error('Error al eliminar', 'No se pudo eliminar la tienda en este momento.');
        }
        setDeleteTiendaConfirm(null);
    };

    const handleOpenCreateStore = () => {
        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const storeLimit = user?.plan?.limits?.stores ?? 0;

        if (!isAdmin && tiendas.length >= storeLimit && storeLimit !== -1) {
            toast.warning(
                'Límite alcanzado',
                `Tu plan actual permite un máximo de ${storeLimit} ${storeLimit === 1 ? 'tienda' : 'tiendas'}. Mejora tu plan para agregar más.`
            );
            return;
        }
        setIsCreateStoreOpen(true);
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {user?.estadoSuscripcion === 'activa' || user?.rol === 'admin' || user?.rol === 'superadmin' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: isMobile ? '20px' : '24px', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
                        <div style={{ flex: 1, minWidth: isMobile ? '100%' : 'auto' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Gestión de Tiendas</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Administra tus puntos de venta y sus configuraciones
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: '12px', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div style={{
                                padding: '8px 16px', backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                flex: isMobile ? 1 : 'none',
                                justifyContent: isMobile ? 'space-between' : 'flex-start'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    Cuota: <span style={{ color: (tiendas.length >= (user?.plan?.limits?.stores ?? 1) && user?.plan?.limits?.stores !== -1) ? 'var(--color-error)' : 'var(--color-primary)' }}>
                                        {tiendas.length}/{user?.plan?.limits?.stores === -1 ? '∞' : (user?.plan?.limits?.stores ?? 1)} Tiendas
                                    </span>
                                </div>
                                <div style={{ width: isMobile ? '40%' : '60px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${user?.plan?.limits?.stores === -1 ? 0 : Math.min((tiendas.length / (user?.plan?.limits?.stores ?? 1)) * 100, 100)}%`,
                                        height: '100%',
                                        backgroundColor: (tiendas.length >= (user?.plan?.limits?.stores ?? 1) && user?.plan?.limits?.stores !== -1) ? 'var(--color-error)' : 'var(--color-primary)'
                                    }} />
                                </div>
                            </div>
                            <Button variant="primary" onClick={handleOpenCreateStore} style={{ gap: '8px' }} fullWidth={isMobile}>
                                <Plus size={16} />
                                Nueva Tienda
                            </Button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {tiendas.map((tienda) => (
                            <div key={tienda.id} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: isMobile ? '24px' : '16px', padding: isMobile ? '20px' : '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {tienda.logo_url ? <img src={tienda.logo_url} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={24} style={{ color: 'var(--color-primary)' }} />}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '16px' }}>{tienda.nombre}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                {(() => {
                                                    const pais = allCountries.find(p => p.codigo_iso_2 === tienda.pais);
                                                    if (pais) {
                                                        return (
                                                            <img
                                                                src={`https://flagcdn.com/w20/${pais.codigo_iso_2.toLowerCase()}.png`}
                                                                width="16"
                                                                height="12"
                                                                style={{ borderRadius: '2px', objectFit: 'cover' }}
                                                                alt={pais.nombre_es}
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{tienda.moneda}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_stores) && (
                                            <button className="action-icon-btn danger" onClick={() => handleConfirmDeleteTienda(tienda.id)} title="Eliminar Tienda"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                                <Button variant="primary" fullWidth size="sm" onClick={() => navigate(`/configuracion/tiendas/${tienda.id}`)}>
                                    Gestionar Tienda
                                </Button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0, 102, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 20px' }}>
                        <CreditCard size={32} />
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '20px' }}>Activa tu plan</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Necesitas una suscripción activa para gestionar tiendas.</p>
                    <Button variant="primary" onClick={() => navigate('/pricing')}>Ver Planes</Button>
                </div>
            )}

            <CreateStoreModal isOpen={isCreateStoreOpen} onClose={() => setIsCreateStoreOpen(false)} />

            <ConfirmDialog
                isOpen={!!deleteTiendaConfirm}
                title={storeToDeleteData?.hasData ? 'No se puede eliminar' : 'Eliminar Tienda'}
                description={storeToDeleteData?.hasData ? `Esta tienda tiene ${storeToDeleteData.costeoCount} costeos vinculados. Debes eliminarlos o moverlos antes de poder borrar la tienda por seguridad.` : '¿Estás seguro de eliminar esta tienda? Esta acción no se puede deshacer y perderás el acceso a sus configuraciones.'}
                confirmLabel={storeToDeleteData?.hasData ? 'Entendido / Ver Costeos' : 'Sí, eliminar'}
                cancelLabel="Cancelar"
                variant={storeToDeleteData?.hasData ? 'info' : 'danger'}
                onConfirm={() => {
                    if (storeToDeleteData?.hasData) {
                        setDeleteTiendaConfirm(null);
                        navigate('/mis-costeos');
                    } else {
                        executeDeleteTienda();
                    }
                }}
                onCancel={() => setDeleteTiendaConfirm(null)}
            />
            <style>{`.action-icon-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px; transition: all 0.2s; color: var(--text-tertiary); } .action-icon-btn:hover { background-color: var(--bg-secondary); color: var(--text-primary); } .action-icon-btn.danger:hover { background-color: rgba(239, 68, 68, 0.1); color: var(--color-error); }`}</style>
        </div>
    );
}
