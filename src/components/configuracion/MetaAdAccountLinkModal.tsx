import React, { useState, useEffect } from 'react';
import { X, Store, CheckCircle2, AlertCircle, Info, Link as LinkIcon, Unlink, Zap, Briefcase } from 'lucide-react';
import { Modal, Button, Spinner, Badge, useToast } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useStoreStore } from '@/store/useStoreStore';
import { cargarPaises, Pais } from '@/services/paisesService';

interface MetaAdAccount {
    id: string;
    name: string;
    account_id: string;
}

interface MetaAdAccountLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: MetaAdAccount | null;
}

export function MetaAdAccountLinkModal({ isOpen, onClose, account }: MetaAdAccountLinkModalProps) {
    const toast = useToast();
    const { tiendas, fetchTiendas } = useStoreStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [linkedStoreIds, setLinkedStoreIds] = useState<string[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [storesWithDependencies, setStoresWithDependencies] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen || !account) return;

            setIsLoading(true);
            try {
                // 1. Cargar datos base
                const [_, paisesData] = await Promise.all([
                    tiendas.length === 0 ? fetchTiendas() : Promise.resolve(),
                    cargarPaises()
                ]);

                if (paisesData) setPaises(paisesData);

                // 2. Traer vínculos actuales
                const { data: links } = await (supabase
                    .from('tiendas_meta_ads' as any)
                    .select('tienda_id')
                    .eq('meta_ad_account_id', account.id) as any);

                const linkedIds = links?.map((v: any) => v.tienda_id) || [];
                setLinkedStoreIds(linkedIds);

                // 3. Verificar dependencias (costeos con campañas Meta) en esas tiendas
                if (linkedIds.length > 0) {
                    const { data: costeos } = await supabase
                        .from('costeos')
                        .select('tienda_id')
                        .in('tienda_id', linkedIds)
                        .not('campaign_id_meta', 'is', null);

                    if (costeos) {
                        const depIds = Array.from(new Set(costeos.map((c: any) => c.tienda_id)));
                        setStoresWithDependencies(depIds as string[]);
                    }
                }
            } catch (err) {
                console.error("Error loading modal data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOpen, account, fetchTiendas]);

    const handleToggleStore = (tiendaId: string) => {
        const isLinked = linkedStoreIds.includes(tiendaId);
        const hasDeps = storesWithDependencies.includes(tiendaId);

        if (isLinked) {
            if (hasDeps) {
                toast.warning('Acción Protegida', 'No puedes desvincular esta tienda porque tiene productos (costeos) asociados a campañas de esta cuenta.');
                return;
            }
            setLinkedStoreIds(prev => prev.filter(id => id !== tiendaId));
        } else {
            setLinkedStoreIds(prev => [...prev, tiendaId]);
        }
    };

    const handleSave = async () => {
        if (!account) return;
        setIsSaving(true);
        try {
            // Sincronización precisa
            const { data: existing } = await (supabase
                .from('tiendas_meta_ads' as any)
                .select('tienda_id')
                .eq('meta_ad_account_id', account.id) as any);

            const existingIds = existing?.map((l: any) => l.tienda_id) || [];
            const toAdd = linkedStoreIds.filter((id: string) => !existingIds.includes(id));
            const toRemove = existingIds.filter((id: string) => !linkedStoreIds.includes(id) && !storesWithDependencies.includes(id));

            if (toRemove.length > 0) {
                await supabase.from('tiendas_meta_ads' as any).delete().eq('meta_ad_account_id', account.id).in('tienda_id', toRemove);
            }

            if (toAdd.length > 0) {
                const inserts = toAdd.map((tid: string) => ({
                    tienda_id: tid,
                    meta_ad_account_id: account.id,
                    usuario_id: (supabase.auth.getSession as any).data?.session?.user?.id
                }));
                await supabase.from('tiendas_meta_ads' as any).insert(inserts);
            }

            toast.success('Cambios guardados', 'Los vínculos se han actualizado exitosamente.');
            onClose();
        } catch (err: any) {
            toast.error('Error', err.message || 'No se pudieron guardar los cambios.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !account) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '8px', borderRadius: '10px',
                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)', color: 'var(--color-primary)'
                    }}>
                        <LinkIcon size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            Vincular Cuenta
                        </h2>
                        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500, margin: 0 }}>
                            GESTIÓN DE INTEGRACIONES META
                        </p>
                    </div>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '12px' }}>
                <div style={{
                    backgroundColor: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'rgba(var(--color-primary-rgb), 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'
                    }}>
                        <Briefcase size={22} />
                    </div>
                    <div>
                        <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Cuenta Activa</p>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{account.name}</h4>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{account.account_id}</p>
                    </div>
                </div>

                <div>
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} style={{ color: 'var(--color-primary)' }} />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Tiendas Disponibles</h4>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <Spinner />
                            <p style={{ marginTop: '12px', color: 'var(--text-tertiary)', fontSize: '13px' }}>Cargando datos...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                            {tiendas.map(tienda => {
                                const isSelected = linkedStoreIds.includes(tienda.id);
                                const hasDeps = storesWithDependencies.includes(tienda.id);
                                const paisObj = paises.find(p => p.codigo_iso_2 === tienda.pais?.toUpperCase());

                                return (
                                    <div key={tienda.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 20px', borderRadius: '16px', border: '1px solid',
                                        borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                                        backgroundColor: isSelected ? 'rgba(var(--color-primary-rgb), 0.03)' : 'var(--bg-primary)',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {paisObj && (
                                                <div style={{
                                                    width: '42px', height: '28px', borderRadius: '4px', overflow: 'hidden',
                                                    border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                }}>
                                                    <img
                                                        src={`https://flagcdn.com/w80/${paisObj.codigo_iso_2.toLowerCase()}.png`}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        alt={paisObj.nombre_es}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{tienda.nombre}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{paisObj?.nombre_es || tienda.pais}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.5 }}>•</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{tienda.shopify_domain || 'Local'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {isSelected && hasDeps && (
                                                <div title="No se puede desvincular: tiene costeos activos." style={{ color: 'var(--color-warning)' }}>
                                                    <AlertCircle size={16} />
                                                </div>
                                            )}
                                            <Button
                                                variant={isSelected ? "secondary" : "primary"}
                                                size="sm"
                                                onClick={() => handleToggleStore(tienda.id)}
                                                disabled={isSelected && hasDeps}
                                                style={{ minWidth: '105px', borderRadius: '10px' }}
                                            >
                                                {isSelected ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Unlink size={14} /> Desvincular</span>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><LinkIcon size={14} /> Vincular</span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <Button variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isSaving}
                        fullWidth
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
