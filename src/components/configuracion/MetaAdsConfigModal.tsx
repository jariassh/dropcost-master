import React, { useState, useEffect } from 'react';
import { Facebook, CheckCircle2, AlertCircle, Search, Info, Trash2, Plus, ExternalLink, ShieldAlert } from 'lucide-react';
import {
    Modal,
    Button,
    Input,
    Spinner,
    Badge,
    useToast,
    ConfirmDialog
} from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { subscriptionService } from '@/services/subscriptionService';
import type { MetaAdAccount, MetaBusinessManager, MetaAccountsResponse } from '@/types/integraciones.types';

interface MetaAdsConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    tiendaId: string;
    tiendaNombre: string;
}

export function MetaAdsConfigModal({ isOpen, onClose, tiendaId, tiendaNombre }: MetaAdsConfigModalProps) {
    const { user } = useAuthStore();
    const toast = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isLinking, setIsLinking] = useState<string | null>(null);
    const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

    const [availableAccounts, setAvailableAccounts] = useState<MetaAdAccount[]>([]);
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
    const [businessManagers, setBusinessManagers] = useState<MetaBusinessManager[]>([]);
    const [selectedBM, setSelectedBM] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isProfileConnected, setIsProfileConnected] = useState(true);

    const [totalUserAccountsCount, setTotalUserAccountsCount] = useState(0);

    const fetchData = async () => {
        if (!isOpen || !user) return;
        setIsLoading(true);
        try {
            // 1. Check if user has Meta profile connected
            const { data: interaction } = await supabase
                .from('integraciones')
                .select('estado')
                .eq('usuario_id', user.id)
                .eq('tipo', 'meta_ads')
                .maybeSingle();

            if (!interaction || interaction.estado !== 'conectado') {
                setIsProfileConnected(false);
                setIsLoading(false);
                return;
            } else {
                setIsProfileConnected(true);
            }

            // 2. Fetch already linked accounts for ANY store of the user (to check total limit)
            const { data: allLinked } = await (supabase
                .from('tiendas_meta_ads' as any)
                .select('*, tiendas!inner(usuario_id)')
                .eq('tiendas.usuario_id', user.id) as any);

            setTotalUserAccountsCount(allLinked?.length || 0);

            // 3. Fetch linked accounts for THIS store
            const { data: linked } = await (supabase
                .from('tiendas_meta_ads' as any)
                .select('*')
                .eq('tienda_id', tiendaId) as any);

            setLinkedAccounts(linked || []);

            // 4. Fetch ALL available accounts from Meta using Edge Function once
            // We use the function name directly to avoid CORS/Routing issues with query params in the path
            const { data, error } = await supabase.functions.invoke('get-meta-accounts', {
                method: 'GET'
            });

            if (error) throw error;

            const response = data as MetaAccountsResponse;
            setAvailableAccounts(response.ad_accounts || []);
            setBusinessManagers(response.business_managers || []);

        } catch (err: any) {
            console.error('Error fetching Meta accounts:', err);
            toast.error('Error', err.message || 'No se pudieron cargar las cuentas publicitarias.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const handleLinkAccount = async (account: MetaAdAccount) => {
        // Enforce limits
        const storeLimit = subscriptionService.getStoreMetaLimit();
        const totalLimit = subscriptionService.getTotalMetaLimit();

        if (linkedAccounts.length >= storeLimit) {
            toast.error('Límite alcanzado', `Tu plan solo permite vincular hasta ${storeLimit} cuentas por tienda.`);
            return;
        }

        if (totalUserAccountsCount >= totalLimit) {
            toast.error('Límite total alcanzado', `Tu plan solo permite vincular hasta ${totalLimit} cuentas publicitarias en total.`);
            return;
        }

        setIsLinking(account.id);
        try {
            const { data, error } = await supabase.functions.invoke('seleccionar-cuenta-meta', {
                body: {
                    tienda_id: tiendaId,
                    meta_ad_account_id: account.id,
                    meta_ad_account_name: account.name
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast.success('Cuenta vinculada', `${account.name} ahora está asociada a esta tienda.`);

            // Refresh counts
            await fetchData();

        } catch (err: any) {
            toast.error('Error de vinculación', err.message);
        } finally {
            setIsLinking(null);
        }
    };

    const handleUnlinkAccount = async (linkedId: string, name: string) => {
        setIsUnlinking(linkedId);
        try {
            const { error } = await (supabase
                .from('tiendas_meta_ads' as any)
                .delete()
                .eq('id', linkedId) as any);

            if (error) throw error;

            toast.success('Cuenta desvinculada', `${name} ya no está asociada a esta tienda.`);

            // Update local state
            setLinkedAccounts(prev => prev.filter(a => a.id !== linkedId));
            setTotalUserAccountsCount(prev => prev - 1);
        } catch (err: any) {
            toast.error('Error', 'No se pudo desvincular la cuenta.');
        } finally {
            setIsUnlinking(null);
        }
    };

    const filteredAccounts = availableAccounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.id.includes(searchTerm) ||
            (acc as any).account_id?.includes(searchTerm);

        const matchesBM = !selectedBM || acc.business?.id === selectedBM;

        return matchesSearch && matchesBM;
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Cuentas Meta Ads - ${tiendaNombre}`}
            size="lg"
        >
            {!isProfileConnected ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <AlertCircle size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Perfil de Meta no Conectado</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                        Primero debes conectar tu perfil de Meta en la sección de Integraciones Generales para poder gestionar las cuentas publicitarias de tus tiendas.
                    </p>
                    <Button variant="primary" onClick={onClose} fullWidth>
                        Entendido
                    </Button>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    maxHeight: 'calc(100vh - 250px)',
                    overflowY: 'auto',
                    paddingRight: '8px',
                    paddingBottom: '10px'
                }}>
                    {/* Indicadores de Límites */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                        padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Cuentas en esta Tienda</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge variant={linkedAccounts.length >= subscriptionService.getStoreMetaLimit() ? 'warning' : 'info'}>
                                    {linkedAccounts.length} / {subscriptionService.getStoreMetaLimit()}
                                </Badge>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Utilizadas</span>
                            </div>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Total Plan</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge variant={totalUserAccountsCount >= subscriptionService.getTotalMetaLimit() ? 'error' : 'info'}>
                                    {totalUserAccountsCount} / {subscriptionService.getTotalMetaLimit()}
                                </Badge>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cuentas totales</span>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Cuentas Vinculadas */}
                    <section>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={16} color="#10B981" />
                            Cuentas Vinculadas a esta Tienda
                        </h4>

                        {linkedAccounts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {linkedAccounts.map(acc => (
                                    <div key={acc.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Facebook size={18} color="#1877F2" />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{acc.meta_ad_account_name}</p>
                                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: {acc.meta_ad_account_id}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            style={{ color: 'var(--color-error)', padding: '4px' }}
                                            onClick={() => handleUnlinkAccount(acc.id, acc.meta_ad_account_name)}
                                            isLoading={isUnlinking === acc.id}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '12px', border: '1px dashed var(--border-color)'
                            }}>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>No hay cuentas publicitarias vinculadas.</p>
                            </div>
                        )}
                    </section>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

                    {/* Buscador y Filtro */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar cuenta publicitaria..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px 10px 40px', borderRadius: '10px',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
                                    fontSize: '14px', color: 'var(--text-primary)', outline: 'none'
                                }}
                            />
                        </div>
                        {businessManagers.length > 0 && (
                            <select
                                value={selectedBM}
                                onChange={e => setSelectedBM(e.target.value)}
                                style={{
                                    maxWidth: '180px', padding: '10px 12px', borderRadius: '10px',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
                                    fontSize: '14px', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer'
                                }}
                            >
                                <option value="">Todos los Portafolios</option>
                                {businessManagers.map(bm => (
                                    <option key={bm.id} value={bm.id}>{bm.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Lista de Cuentas Disponibles */}
                    <section style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                            Cuentas Disponibles en tu Perfil
                        </h4>

                        {isLoading ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Spinner />
                            </div>
                        ) : filteredAccounts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                                {filteredAccounts.map(account => {
                                    const isLinked = linkedAccounts.some(la => la.meta_ad_account_id === account.id);
                                    const storeLimitReached = linkedAccounts.length >= subscriptionService.getStoreMetaLimit();
                                    const totalLimitReached = totalUserAccountsCount >= subscriptionService.getTotalMetaLimit();
                                    const cannotAdd = !isLinked && (storeLimitReached || totalLimitReached);

                                    return (
                                        <div key={account.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '12px 16px', backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)', borderRadius: '12px',
                                            opacity: isLinked ? 0.7 : 1
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Facebook size={18} color={isLinked ? 'var(--text-tertiary)' : "#1877F2"} />
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{account.name}</p>
                                                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        ID: {account.id}
                                                        <span style={{
                                                            padding: '1px 6px',
                                                            backgroundColor: 'rgba(24, 119, 242, 0.1)',
                                                            color: '#1877F2',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: 600
                                                        }}>
                                                            {account.business?.name || 'Personal'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            {isLinked ? (
                                                <Badge variant="success">YA VINCULADA</Badge>
                                            ) : cannotAdd ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)' }}>
                                                    <ShieldAlert size={14} />
                                                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Límite Excedido</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    style={{ gap: '6px' }}
                                                    onClick={() => handleLinkAccount(account)}
                                                    isLoading={isLinking === account.id}
                                                >
                                                    <Plus size={14} />
                                                    Vincular
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                                <Facebook size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px', opacity: 0.3 }} />
                                <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px' }}>No se encontraron cuentas disponibles.</p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={onClose} style={{ minWidth: '120px' }}>
                    Listo
                </Button>
            </div>
        </Modal>
    );
}
