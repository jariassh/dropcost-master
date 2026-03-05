import React, { useState, useEffect } from 'react';
import { Search, Target, CheckCircle2, AlertCircle, Info, ArrowRight, RefreshCw, Facebook } from 'lucide-react';
import { Card, Button, Badge, useToast, Spinner } from '@/components/common';
import { supabase } from '@/lib/supabase';

interface StepAssignAdAccountsProps {
    tiendaId: string;
    onComplete: () => void;
}

interface AdAccount {
    id: string;
    name: string;
    account_id: string;
    business_name?: string;
}

export function StepAssignAdAccounts({ tiendaId, onComplete }: StepAssignAdAccountsProps) {
    const toast = useToast();
    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [alreadyLinkedIds, setAlreadyLinkedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fromCache, setFromCache] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (accounts.length === 0) {
            fetchMetaAccounts();
        }
        fetchAlreadyLinked();
    }, [tiendaId]);

    const fetchMetaAccounts = async (sync = false) => {
        if (sync) setIsSyncing(true);
        else setIsLoading(true);

        setError(null);
        try {
            // Fetching accounts...
            const { data, error: funcError } = await supabase.functions.invoke('get-meta-accounts', {
                body: { sync }
            });

            if (funcError) {
                setError(funcError.message || 'Error de conexión');
                return;
            }

            if (data?.error) {
                setError(data.error);
                return;
            }

            if (data) {
                setFromCache(!!data.from_cache);
                setLastSyncedAt(data.last_synced_at || (sync ? new Date().toISOString() : null));
                if (data.ad_accounts) {
                    const mapped = data.ad_accounts.map((acc: any) => ({
                        id: acc.id,
                        name: acc.name,
                        account_id: acc.account_id || acc.id,
                        business_name: acc.business?.name || 'Personal'
                    }));

                    const mappedSorted = mapped.sort((a: any, b: any) => {
                        const bizA = a.business_name || 'Personal';
                        const bizB = b.business_name || 'Personal';
                        if (bizA !== bizB) return bizA.localeCompare(bizB);
                        return a.name.localeCompare(b.name);
                    });

                    setAccounts(mappedSorted);
                } else {
                    setAccounts([]);
                }
            } else {
                setFromCache(false);
                setAccounts([]);
            }
        } catch (err: any) {
            console.error("[StepAssignAdAccounts] Error:", err);
            setError(err.message || 'Error al cargar cuentas');
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    // Cargar cuentas ya vinculadas a esta tienda
    const fetchAlreadyLinked = async () => {
        if (!tiendaId) return;
        try {
            const { data } = await supabase
                .from('tiendas_meta_ads' as any)
                .select('meta_ad_account_id')
                .eq('tienda_id', tiendaId);

            if (data && data.length > 0) {
                const linkedIds = data.map((row: any) => row.meta_ad_account_id);
                setAlreadyLinkedIds(linkedIds);
                setSelectedIds(linkedIds); // Pre-seleccionar las ya vinculadas
            }
        } catch (err) {
            console.error("Error fetching linked accounts:", err);
        }
    };

    const handleToggleAccount = async (id: string) => {
        const isCurrentlySelected = selectedIds.includes(id);

        if (isCurrentlySelected) {
            // Desvincular
            setSelectedIds((prev: string[]) => prev.filter((i: string) => i !== id));
            try {
                await supabase
                    .from('tiendas_meta_ads' as any)
                    .delete()
                    .eq('tienda_id', tiendaId)
                    .eq('meta_ad_account_id', id);
                setAlreadyLinkedIds((prev: string[]) => prev.filter((i: string) => i !== id));
            } catch (err) {
                // Revertir en caso de error
                setSelectedIds((prev: string[]) => [...prev, id]);
                toast.error('Error', 'No se pudo desvincular la cuenta.');
            }
        } else {
            // Vincular
            setSelectedIds((prev: string[]) => [...prev, id]);
            const acc = accounts.find((a: AdAccount) => a.id === id);
            try {
                const { error } = await supabase
                    .from('tiendas_meta_ads' as any)
                    .upsert({
                        tienda_id: tiendaId,
                        meta_ad_account_id: id,
                        meta_ad_account_name: acc?.name,
                        is_active: true
                    }, { onConflict: 'tienda_id,meta_ad_account_id' });
                if (error) throw error;
                setAlreadyLinkedIds((prev: string[]) => [...prev, id]);
                onComplete(); // Marcar paso como completado
            } catch (err: any) {
                setSelectedIds((prev: string[]) => prev.filter((i: string) => i !== id));
                if (err.code !== '23505') {
                    toast.error('Error', 'No se pudo vincular la cuenta.');
                }
            }
        }
    };




    const filtered = accounts
        .filter((acc: AdAccount) =>
            acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.id.includes(searchTerm)
        )
        .sort((a, b) => {
            const bizA = a.business_name || 'Personal';
            const bizB = b.business_name || 'Personal';
            if (bizA !== bizB) return bizA.localeCompare(bizB);
            return a.name.localeCompare(b.name);
        });

    return (
        <Card style={{ padding: isMobile ? '24px 20px' : '32px' }}>
            <div style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '16px' : '0',
                paddingBottom: '20px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Facebook size={20} color="var(--color-primary)" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Perfil conectado</h3>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column-reverse' : 'row',
                    gap: '12px',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    {lastSyncedAt && (
                        <div style={{
                            textAlign: isMobile ? 'left' : 'right',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMobile ? 'flex-start' : 'flex-end',
                            marginRight: isMobile ? '0' : '12px'
                        }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Sincronizado: {new Date(lastSyncedAt).toLocaleString()}
                            </span>
                        </div>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fetchMetaAccounts(true)}
                        disabled={isSyncing || isLoading}
                        fullWidth={isMobile}
                    >
                        {isSyncing ? <Spinner size="sm" /> : <RefreshCw size={14} style={{ marginRight: '6px' }} />}
                        Sincronizar
                    </Button>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    backgroundColor: alreadyLinkedIds.length > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(var(--color-primary-rgb), 0.1)',
                    color: alreadyLinkedIds.length > 0 ? 'var(--color-success)' : 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px'
                }}>
                    {alreadyLinkedIds.length > 0 ? <CheckCircle2 size={32} /> : <Target size={32} />}
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {alreadyLinkedIds.length > 0 ? 'Cuentas publicitarias configuradas' : 'Selecciona tus cuentas publicitarias'}
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    {alreadyLinkedIds.length > 0
                        ? `${alreadyLinkedIds.length} ${alreadyLinkedIds.length === 1 ? 'cuenta vinculada' : 'cuentas vinculadas'} a esta tienda`
                        : '¿Cuál cuenta de Meta administra esta tienda?'}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {isLoading ? (
                    <div style={{
                        padding: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px'
                    }}>
                        <Spinner size="lg" />
                        <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>Cargando cuentas publicitarias...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <AlertCircle size={24} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>No se pudieron cargar las cuentas</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>
                            {error}
                        </p>
                        <Button variant="secondary" onClick={() => fetchMetaAccounts(false)}>
                            Intentar de nuevo
                        </Button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 48px',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{
                            maxHeight: '320px',
                            overflowY: 'auto',
                            paddingRight: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                        }}>
                            {filtered.length > 0 ? (
                                filtered.map(account => (
                                    <div
                                        key={account.id}
                                        onClick={() => handleToggleAccount(account.id)}
                                        style={{
                                            padding: isMobile ? '12px' : '16px',
                                            borderRadius: '16px',
                                            backgroundColor: selectedIds.includes(account.id)
                                                ? 'rgba(var(--color-primary-rgb), 0.08)'
                                                : alreadyLinkedIds.includes(account.id)
                                                    ? 'var(--bg-secondary)'
                                                    : 'var(--bg-primary)',
                                            border: `1px solid ${selectedIds.includes(account.id) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                            cursor: alreadyLinkedIds.includes(account.id) ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s ease',
                                            opacity: alreadyLinkedIds.includes(account.id) ? 0.7 : 1,
                                            gap: '12px',
                                            minWidth: 0
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Target size={20} />
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.name}</p>
                                                <p style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {account.business_name} • ID: {account.account_id}
                                                </p>
                                            </div>
                                        </div>

                                        {alreadyLinkedIds.includes(account.id) ? (
                                            <div style={{ flexShrink: 0 }}>
                                                <Badge variant="success">VINCULADA</Badge>
                                            </div>
                                        ) : selectedIds.includes(account.id) ? (
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                backgroundColor: 'var(--color-primary)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <CheckCircle2 size={16} />
                                            </div>
                                        ) : (
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                border: '2px solid var(--border-color)',
                                                flexShrink: 0
                                            }} />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                    No se encontraron cuentas publicitarias.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
}
