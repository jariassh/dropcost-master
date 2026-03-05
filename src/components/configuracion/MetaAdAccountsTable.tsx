import React, { useState, useEffect } from 'react';
import { Target, Activity, RefreshCw, AlertCircle, CheckCircle2, Link as LinkIcon, Edit3, X, Zap, Briefcase } from 'lucide-react';
import { Card, Badge, Spinner, Button, useToast } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { MetaAdAccountLinkModal } from './MetaAdAccountLinkModal';

interface AdAccount {
    id: string;
    nombre: string;
    account_id: string;
    currency: string;
    status: 'ACTIVE' | 'DISABLED' | 'PENDING';
    is_linked: boolean;
    business_name?: string;
    linked_store_ids?: string[];
}

export function MetaAdAccountsTable({ integrationId }: { integrationId?: string | null }) {
    const { user } = useAuthStore();
    const toast = useToast();
    const { fetchTiendas } = useStoreStore();

    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [dbLinks, setDbLinks] = useState<{ tienda_id: string, meta_ad_account_id: string }[]>([]);

    // Modal state
    const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const activeAccountsCount = accounts.filter(a =>
        dbLinks.some(link => link.meta_ad_account_id === a.id)
    ).length;
    const totalQuota = 10;

    const fetchDbLinks = async () => {
        const { data } = await supabase
            .from('tiendas_meta_ads' as any)
            .select('tienda_id, meta_ad_account_id');
        if (data) setDbLinks(data as any);
    };

    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

    const fetchMetaAccounts = async (sync = false) => {
        const { data: metaData, error } = await supabase.functions.invoke('get-meta-accounts', {
            body: { sync, integrationId }
        });

        if (!error && metaData?.ad_accounts) {
            const mapped = metaData.ad_accounts.map((acc: any) => ({
                id: acc.id,
                nombre: acc.name,
                account_id: acc.account_id || acc.id,
                currency: acc.currency || 'USD',
                status: acc.account_status === 1 ? 'ACTIVE' : 'DISABLED',
                business_name: acc.business?.name || 'Personal'
            }));
            const mappedSorted = mapped.sort((a: any, b: any) => {
                const bizA = a.business_name || 'Personal';
                const bizB = b.business_name || 'Personal';
                if (bizA !== bizB) return bizA.localeCompare(bizB);
                return a.nombre.localeCompare(b.nombre);
            });
            setAccounts(mappedSorted);
            setLastSyncedAt(metaData.last_synced_at || (sync ? new Date().toISOString() : null));
        } else {
            console.error("Error fetching meta accounts:", error);
            setAccounts([]);
        }
    };

    const initialLoad = async () => {
        if (!user || !integrationId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            await fetchTiendas();
            const promises = [fetchDbLinks()];
            if (accounts.length === 0) {
                promises.push(fetchMetaAccounts());
            }
            await Promise.all(promises);
        } catch (err) {
            console.error("Error initial load:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initialLoad();
    }, [user, integrationId]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchMetaAccounts(true);
            await fetchDbLinks();
            toast.success('Sincronización Completada', 'Datos actualizados desde Meta.');
        } catch (error) {
            toast.error('Error', 'No se pudo sincronizar.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleOpenLinkModal = (acc: AdAccount) => {
        setSelectedAccount(acc);
        setIsLinkModalOpen(true);
    };

    if (isLoading) {
        return (
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <Spinner size="lg" />
                <p style={{ marginTop: '16px', color: 'var(--text-tertiary)', fontSize: '14px' }}>Cargando cuentas...</p>
            </Card>
        );
    }

    if (!integrationId) {
        return (
            <Card style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', minHeight: '400px' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '24px',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                    color: 'var(--color-primary)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
                }}>
                    <Target size={40} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>Cuentas Publicitarias</h3>
                <p style={{ maxWidth: '320px', fontSize: '15px', color: 'var(--text-tertiary)', lineHeight: 1.6, margin: 0 }}>
                    Selecciona o conecta un perfil de Meta Ads en la tarjeta superior para listar y gestionar tus cuentas aquí.
                </p>
            </Card>
        );
    }

    return (
        <Card noPadding style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)', animation: 'fadeIn 0.4s' }}>
            <div style={{ padding: isMobile ? '16px' : '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', backgroundColor: 'var(--bg-primary)', gap: isMobile ? '16px' : '20px' }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '20px' }}>
                    <div>
                        <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} style={{ color: 'var(--color-primary)' }} />
                            Cuentas de Meta Ads
                        </h3>
                        {!isMobile && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>Gestiona la vinculación de cuentas con tus tiendas</p>}
                    </div>

                    {!isMobile && <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>}

                    <div style={{ width: isMobile ? '100%' : 'auto' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuota de Plan</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Badge variant={activeAccountsCount >= totalQuota ? 'pill-warning' : 'pill-info'} style={{ fontSize: '10px', padding: '4px 10px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                                {activeAccountsCount} / {totalQuota} {isMobile ? 'Vinculadas' : 'Cuentas vinculadas'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'row', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', gap: '12px' }}>
                    {lastSyncedAt && (
                        <div style={{ textAlign: isMobile ? 'left' : 'right', display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'flex-end', marginRight: isMobile ? 0 : '12px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {isMobile ? 'Sinc: ' : 'Sincronizado: '}{new Date(lastSyncedAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSync}
                        isLoading={isSyncing}
                        style={{ border: '1px solid var(--border-color)', gap: '6px', fontSize: '12px', flex: isMobile ? 1 : 'none' }}
                    >
                        <RefreshCw size={14} /> {isMobile ? 'Sync' : 'Sincronizar'}
                    </Button>
                </div>
            </div>

            <div style={{ overflowX: 'auto', flex: 1, minHeight: '300px', WebkitOverflowScrolling: 'touch' }}>
                {accounts.length === 0 ? (
                    <div style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                            <Target size={48} style={{ opacity: 0.3 }} />
                        </div>
                        <h4 style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>No se encontraron cuentas</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)', maxWidth: '300px' }}>
                            No hemos detectado cuentas publicitarias en tu perfil de Meta. Asegúrate de tener permisos en el Business Manager.
                        </p>
                    </div>
                ) : (
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ ...tableHeaderStyle, width: '300px' }}>Cuenta Publicitaria</th>
                                <th style={{ ...tableHeaderStyle, width: '200px' }}>Business Manager (BM)</th>
                                <th style={{ ...tableHeaderStyle, width: '120px' }}>Estado</th>
                                <th style={{ ...tableHeaderStyle, width: '180px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((acc) => {
                                const isLinked = dbLinks.some(l => l.meta_ad_account_id === acc.id);
                                return (
                                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                                    <Target size={20} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{acc.nombre}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{acc.currency} • ID: {acc.account_id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                                <Briefcase size={14} style={{ opacity: 0.6 }} />
                                                <span style={{ fontSize: '13px' }}>{acc.business_name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {isLinked ? (
                                                <Badge variant="success">ACTIVA</Badge>
                                            ) : (
                                                <Badge variant="error" style={{ opacity: 0.7 }}>INACTIVA</Badge>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                style={{ gap: '6px', fontSize: '12px' }}
                                                onClick={() => handleOpenLinkModal(acc)}
                                            >
                                                {isLinked ? <Edit3 size={14} /> : <LinkIcon size={14} />}
                                                {isLinked ? 'Gestionar Vínculos' : 'Vincular a Tiendas'}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} color="var(--color-primary)" />
                    Una cuenta publicitaria puede estar vinculada a múltiples tiendas. Haz clic en "Gestionar Vínculos" para ver o cambiar las asociaciones.
                </p>
            </div>

            {/* Modal de Vinculación */}
            {selectedAccount && (
                <MetaAdAccountLinkModal
                    isOpen={isLinkModalOpen}
                    onClose={() => {
                        setIsLinkModalOpen(false);
                        setSelectedAccount(null);
                        fetchDbLinks(); // ESTO ES LA CLAVE: Solo actualizamos los vínculos, no llamamos a Meta de nuevo.
                    }}
                    account={{
                        id: selectedAccount.id,
                        name: selectedAccount.nombre,
                        account_id: selectedAccount.account_id
                    }}
                />
            )}

            <style>{`
                .table-row-hover:hover {
                    background-color: rgba(var(--color-primary-rgb), 0.02);
                }
            `}</style>
        </Card>
    );
}

const tableHeaderStyle: React.CSSProperties = {
    padding: '12px 24px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};
