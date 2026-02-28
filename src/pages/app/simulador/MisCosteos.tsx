/**
 * MisCosteos - Tabla de costeos guardados con gestión de cuotas y flujo de tienda.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Copy,
    Trash2,
    Calculator,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Package,
    ArrowRight,
    Store, // Re-added as it's used later
    Check, X, Info, Eye // Re-added as they are used later
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStoreStore } from '@/store/useStoreStore';
import { costeoService } from '@/services/costeoService';
import { useToast, Card, Button, Input, Modal, Badge, Spinner, ConfirmDialog, EmptyState, Tooltip } from '@/components/common'; // Tooltip re-added
import { formatDisplayDate } from '@/utils/dateUtils';
import type { SavedCosteo } from '@/types/simulator';
import { CreateStoreModal } from '@/components/layout/CreateStoreModal'; // Re-added as it's used later

export function MisCosteos() {
    const navigate = useNavigate();
    const toast = useToast();
    const user = useAuthStore(state => state.user);
    const tiendas = useStoreStore(state => state.tiendas);
    const tiendaActual = useStoreStore(state => state.tiendaActual);
    const storesLoading = useStoreStore(state => state.isLoading);

    const isFetching = useRef(false);

    const [costeos, setCosteos] = useState<SavedCosteo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateStoreOpen, setCreateStoreOpen] = useState(false);
    const [isCreateCosteoOpen, setCreateCosteoOpen] = useState(false);
    const [newCosteoName, setNewCosteoName] = useState('');

    const [quota, setQuota] = useState<{ used: number; limit: number }>({ used: 0, limit: 0 });

    // Confirmación de eliminación
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const fetchCosteos = useCallback(async () => {
        if (!tiendaActual || isFetching.current) {
            if (!tiendaActual && !storesLoading) setIsLoading(false);
            return;
        }

        isFetching.current = true;
        setIsLoading(true);
        try {
            const data = await costeoService.listCosteos(tiendaActual.id, user!.id);
            setCosteos(data);

            // Obtener cuota - El límite viene del plan del usuario
            const count = data.length;
            const limit = user?.plan?.limits?.costeos_limit ?? 100;
            setQuota({ used: count, limit });
        } catch (error) {
            console.error('Error listing costeos loop check:', error);
            // Solo mostramos toast si no es un error de cancelación o similar
            toast.error('Error al cargar costeos');
        } finally {
            setIsLoading(false);
            isFetching.current = false;
        }
    }, [tiendaActual?.id, storesLoading, user?.plan?.limits?.costeos_limit, toast]);

    useEffect(() => {
        fetchCosteos();
    }, [fetchCosteos]);

    // Migración única de localStorage (Rescate de datos previos)
    useEffect(() => {
        const doMigration = async () => {
            if (!tiendaActual?.id || storesLoading || isFetching.current) return;

            const legacyData = localStorage.getItem('dropcost_costeos');
            if (!legacyData) return;

            try {
                const localCosteos = JSON.parse(legacyData);
                if (Array.isArray(localCosteos) && localCosteos.length > 0) {
                    // Solo migrar si no hay costeos en DB (para no duplicar en cada refresh si algo falla)
                    const dbCosteos = await costeoService.listCosteos(tiendaActual.id, user!.id);

                    if (dbCosteos.length === 0) {
                        toast.info('Detectamos costeos locales. Migrando a la nube...', 'Espera un momento');

                        for (const c of localCosteos) {
                            const nombre = c.nombre_producto || c.productName || 'Producto Migrado';
                            // Creamos el registro base. Los detalles complejos (inputs/results) 
                            // podrían migrarse aquí también si se desea, pero por ahora aseguramos el registro.
                            await costeoService.createEmptyCosteo(nombre, tiendaActual.id);
                        }

                        localStorage.removeItem('dropcost_costeos');
                        toast.success('Migración exitosa', `${localCosteos.length} costeos recuperados.`);
                        fetchCosteos(); // Recargar lista
                    }
                } else {
                    localStorage.removeItem('dropcost_costeos');
                }
            } catch (e) {
                console.error('Error migrando costeos:', e);
            }
        };

        doMigration();
    }, [tiendaActual?.id, storesLoading, fetchCosteos, toast]);

    const filteredCosteos = costeos.filter((c) => {
        const matchesSearch = c.nombre_producto.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesDate = true;
        if (dateFilter.start) {
            // Comparar con el inicio del día del usuario
            const startDate = new Date(dateFilter.start + 'T00:00:00');
            matchesDate = matchesDate && new Date(c.created_at) >= startDate;
        }
        if (dateFilter.end) {
            // Comparar con el fin del día del usuario
            const endDate = new Date(dateFilter.end + 'T23:59:59');
            matchesDate = matchesDate && new Date(c.created_at) <= endDate;
        }

        return matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredCosteos.length / pageSize);
    const paginatedCosteos = filteredCosteos.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const formatCurrency = (val?: number | null) =>
        (val !== undefined && val !== null)
            ? '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : '$0';

    const formatDate = (iso: string) => formatDisplayDate(iso);

    const handleDuplicate = (costeo: SavedCosteo) => {
        setCosteoToDuplicate(costeo);
        // Sugerir nombre sin acumular "(copia)" infinitamente
        const baseNombre = costeo.nombre_producto.replace(/\s\(copia\)$/i, '');
        setNuevoNombreCopia(`${baseNombre} (copia)`);
        setShowDuplicarModal(true);
    };

    const handleConfirmDuplicate = async () => {
        if (!costeoToDuplicate || !nuevoNombreCopia.trim()) return;

        const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
        const canDuplicate = user?.plan?.limits?.can_duplicate_costeos || isAdmin;

        if (!canDuplicate) {
            toast.warning('Función Premium', 'La duplicación de costeos no está habilitada en tu plan actual.');
            return;
        }

        if (quota.used >= quota.limit && !isAdmin) {
            toast.warning('Límite de Cuota', 'Has alcanzado el límite de costeos de tu plan.');
            return;
        }

        setIsDuplicating(true);
        try {
            await costeoService.duplicateCosteo(costeoToDuplicate, nuevoNombreCopia.trim());
            toast.success('Costeo duplicado');
            setShowDuplicarModal(false);
            setCosteoToDuplicate(null);
            setNuevoNombreCopia('');
            fetchCosteos();
        } catch (error: any) {
            toast.error(error.message || 'Error al duplicar costeo');
        } finally {
            setIsDuplicating(false);
        }
    };

    async function handleDelete() {
        if (!itemToDelete) return;
        try {
            await costeoService.deleteCosteo(itemToDelete);
            toast.info('Costeo eliminado');
            setConfirmOpen(false);
            setItemToDelete(null);
            fetchCosteos();
        } catch (error) {
            toast.error('Error al eliminar costeo');
        }
    }

    // --- Estado para Nuevo Costeo (Modal) ---
    const [showNuevoModal, setShowNuevoModal] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const [showDuplicarModal, setShowDuplicarModal] = useState(false);
    const [costeoToDuplicate, setCosteoToDuplicate] = useState<SavedCosteo | null>(null);
    const [nuevoNombreCopia, setNuevoNombreCopia] = useState('');
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleVerCosteo = (id: string) => navigate(`/mis-costeos/${id}`);

    async function handleUpdateField(id: string, field: string, value: string) {
        try {
            await costeoService.updateCosteo(id, { [field]: value } as any);
            setCosteos(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        } catch (error) {
            toast.error('Error al actualizar campo');
        }
    }

    const handleConfirmNuevo = async () => {
        if (!nuevoNombre.trim() || !tiendaActual?.id) {
            toast.warning('Ingresa un nombre para el producto y selecciona una tienda');
            return;
        }

        setIsCreating(true);
        try {
            const costeo = await costeoService.createEmptyCosteo(nuevoNombre.trim(), tiendaActual.id);
            toast.success('Costeo iniciado');
            setShowNuevoModal(false);
            setNuevoNombre('');
            navigate(`/mis-costeos/${costeo.id}`);
        } catch (error: any) {
            toast.error(error.message || 'Error al crear costeo');
        } finally {
            setIsCreating(false);
        }
    };

    // ─── ESTADO: SIN TIENDAS ───
    if (!storesLoading && tiendas.length === 0) {
        return (
            <div style={{
                maxWidth: '640px', margin: '60px auto', textAlign: 'center',
                padding: '48px 40px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--border-color)',
                boxShadow: 'var(--shadow-xl)',
            }}>
                <div style={{
                    width: '96px', height: '96px', borderRadius: '28px',
                    backgroundColor: 'rgba(0,102,255,0.08)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                    border: '1px solid rgba(0,102,255,0.1)'
                }}>
                    <Store size={48} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    ¡Crea tu primera tienda!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', lineHeight: 1.7, fontSize: '16px' }}>
                    Para comenzar a simular precios y gestionar tus costeos con precisión, primero necesitamos configurar tu tienda.
                </p>
                <button
                    onClick={() => setCreateStoreOpen(true)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        padding: '14px 32px', fontSize: '16px', fontWeight: 700,
                        color: '#ffffff', background: 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                        border: 'none', borderRadius: '12px', cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(0, 102, 255, 0.3)',
                    }}
                >
                    <Plus size={20} />
                    Crear mi Primera Tienda
                </button>

                <CreateStoreModal
                    isOpen={isCreateStoreOpen}
                    onClose={() => setCreateStoreOpen(false)}
                />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Mis Costeos
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Gestiona y analiza la viabilidad de tus productos
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Indicador de Cuota */}
                    <div style={{
                        padding: '8px 16px', backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '12px', border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Cuota: <span style={{ color: quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)' }}>{quota.used}/{quota.limit === -1 ? '∞' : quota.limit} Costeos</span>
                        </div>
                        <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.min((quota.used / quota.limit) * 100, 100)}%`,
                                height: '100%',
                                backgroundColor: quota.used >= quota.limit ? 'var(--color-error)' : 'var(--color-primary)'
                            }} />
                        </div>
                    </div>

                    <button
                        onClick={() => setShowNuevoModal(true)}
                        disabled={quota.used >= quota.limit && user?.rol !== 'admin' && user?.rol !== 'superadmin'}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', fontSize: '14px', fontWeight: 700,
                            color: '#fff',
                            background: quota.used >= quota.limit && user?.rol !== 'admin' && user?.rol !== 'superadmin'
                                ? 'var(--text-tertiary)'
                                : 'linear-gradient(135deg, #0066FF 0%, #003D99 100%)',
                            border: 'none', borderRadius: '12px', cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0,102,255,0.2)',
                        }}
                    >
                        <Plus size={18} /> Nuevo Costeo
                    </button>
                </div>
            </div>

            {/* Banner Advertencia Cuota Baja */}
            {quota.limit - quota.used > 0 && quota.limit - quota.used < 10 && (
                <div style={{
                    marginBottom: '24px', padding: '12px 20px', backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid var(--color-warning)', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-warning)'
                }}>
                    <Info size={18} />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                        ⚠️ Te quedan solo {quota.limit - quota.used} costeos disponibles en tu plan actual.
                    </span>
                </div>
            )}

            {/* Filters */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)30',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                    {/* Buscador más corto */}
                    <div style={{ position: 'relative', width: '320px' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute', left: '14px', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={{
                                width: '100%', padding: '10px 16px 10px 42px',
                                fontSize: '14px', border: '1.5px solid var(--border-color)',
                                borderRadius: '10px', backgroundColor: 'var(--card-bg)',
                                color: 'var(--text-primary)', outline: 'none',
                                transition: 'all 0.2s',
                            }}
                        />
                    </div>

                    {/* Selectores de Fecha con labels horizontales */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--card-bg)',
                            padding: '2px 12px',
                            borderRadius: '10px',
                            border: '1.5px solid var(--border-color)'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>DESDE:</span>
                            <input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => {
                                    setDateFilter(prev => ({ ...prev, start: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: 'none',
                                    fontSize: '13px',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    padding: '8px 0',
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--card-bg)',
                            padding: '2px 12px',
                            borderRadius: '10px',
                            border: '1.5px solid var(--border-color)'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>HASTA:</span>
                            <input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => {
                                    setDateFilter(prev => ({ ...prev, end: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                style={{
                                    border: 'none',
                                    fontSize: '13px',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    padding: '8px 0',
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Ver:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        style={{
                            padding: '8px 12px',
                            fontSize: '13px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <option value={10}>10 registros</option>
                        <option value={20}>20 registros</option>
                        <option value={50}>50 registros</option>
                        <option value={100}>100 registros</option>
                    </select>
                </div>
            </div>

            {/* Table or Empty state */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                    <Spinner size="lg" />
                </div>
            ) : filteredCosteos.length === 0 ? (
                <EmptyState
                    icon={<Calculator size={48} />}
                    title={searchQuery || dateFilter.start || dateFilter.end ? 'Sin resultados' : 'Aún no tienes costeos'}
                    description={
                        searchQuery || dateFilter.start || dateFilter.end
                            ? 'No se encontraron resultados para los filtros aplicados.'
                            : 'Comienza creando tu primer costeo para analizar la rentabilidad de tus productos.'
                    }
                    action={searchQuery || dateFilter.start || dateFilter.end ? undefined : { label: 'Crear Nuevo Costeo', onClick: () => setShowNuevoModal(true) }}
                />
            ) : (
                <>
                    <Card noPadding style={{ overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        {[
                                            { label: 'Producto' },
                                            { label: 'Precio Final' },
                                            { label: 'Utilidad' },
                                            {
                                                label: 'ID Meta',
                                                tooltip: "Activa la columna 'Identificador de la campaña' en Meta Ads Business Manager."
                                            },
                                            {
                                                label: 'ID Shopify',
                                                tooltip: "Lo encuentras al final de la URL del producto en Shopify (ej: 8618138108057)."
                                            },
                                            { label: 'Estado' },
                                            { label: 'Fecha' },
                                            { label: 'Acciones' }
                                        ].map((col) => (
                                            <th key={col.label} style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {col.label}
                                                    {col.tooltip && (
                                                        <Tooltip content={col.tooltip}>
                                                            <Info size={12} style={{ opacity: 0.6, cursor: 'help' }} />
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCosteos.map((c) => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre_producto}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 700, color: c.estado === 'vacio' ? 'var(--text-tertiary)' : 'inherit' }}>
                                                {c.estado === 'vacio' ? '---' : formatCurrency(c.precio_final)}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: c.estado === 'vacio' ? 'var(--text-tertiary)' : ((c.utilidad_neta || 0) > 0 ? 'var(--color-success)' : 'var(--color-error)')
                                                }}>
                                                    {c.estado === 'vacio' ? '---' : formatCurrency(c.utilidad_neta)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 16px' }}>
                                                <InlineEdit
                                                    value={c.meta_campaign_id || ''}
                                                    placeholder="Campaña..."
                                                    onSave={(val) => handleUpdateField(c.id, 'meta_campaign_id', val)}
                                                />
                                            </td>
                                            <td style={{ padding: '8px 16px' }}>
                                                <InlineEdit
                                                    value={c.product_id_shopify || ''}
                                                    placeholder="Shopify ID..."
                                                    onSave={(val) => handleUpdateField(c.id, 'product_id_shopify', val)}
                                                />
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                                    backgroundColor: c.estado === 'guardado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: c.estado === 'guardado' ? 'var(--color-success)' : 'var(--color-warning)',
                                                    textTransform: 'uppercase',
                                                    display: 'inline-block',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {c.estado === 'guardado' ? 'Analizado' : 'Sin Datos'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-tertiary)' }}>{formatDate(c.created_at)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <ActionBtn icon={<Eye size={16} />} title="Ver / Editar" onClick={() => navigate(`/mis-costeos/${c.id}`)} />
                                                    <ActionBtn
                                                        icon={<Copy size={16} />}
                                                        title="Duplicar"
                                                        onClick={() => handleDuplicate(c)}
                                                        disabled={c.estado === 'vacio'}
                                                        tooltip={c.estado === 'vacio' ? "Completa el costeo antes de duplicar" : undefined}
                                                    />
                                                    <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
                                                    {(user?.rol === 'admin' || user?.rol === 'superadmin' || user?.plan?.limits?.can_delete_costeos) && (
                                                        <ActionBtn icon={<Trash2 size={16} />} title="Eliminar" onClick={() => { setItemToDelete(c.id); setConfirmOpen(true); }} danger />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination Navigation */}
                    {totalPages > 1 && (
                        <div style={{
                            marginTop: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0 8px'
                        }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Mostrando página <strong>{currentPage}</strong> de {totalPages} ({filteredCosteos.length} costeos totales)
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Nuevo Costeo */}
            <Modal
                isOpen={showNuevoModal}
                onClose={() => !isCreating && setShowNuevoModal(false)}
                title="Nuevo Costeo"
                size="sm"
            >
                <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Ingresa el nombre del producto para comenzar la simulación. Se descontará 1 costeo de tu cuota.
                    </p>
                    <Input
                        label="Nombre del Producto"
                        placeholder="Ej: Crema hidratante"
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button
                            variant="secondary"
                            onClick={() => setShowNuevoModal(false)}
                            disabled={isCreating}
                            fullWidth
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmNuevo}
                            isLoading={isCreating}
                            disabled={!nuevoNombre.trim()}
                            fullWidth
                        >
                            Comenzar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirmar Eliminación */}
            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar Costeo"
                description="¿Estás seguro de que deseas eliminar este costeo? Esta acción retirará el registro de tu historial de forma permanente."
                confirmLabel="Sí, eliminar"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />

            {/* Modal de Duplicar Costeo */}
            <Modal
                isOpen={showDuplicarModal}
                onClose={() => !isDuplicating && setShowDuplicarModal(false)}
                title="Duplicar Costeo"
                size="sm"
            >
                <div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Ingresa el nombre para la nueva copia del costeo.
                    </p>
                    <Input
                        label="Nombre del Producto"
                        placeholder="Ej: Crema hidratante (Copia)"
                        value={nuevoNombreCopia}
                        onChange={(e) => setNuevoNombreCopia(e.target.value)}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <Button
                            variant="secondary"
                            onClick={() => setShowDuplicarModal(false)}
                            disabled={isDuplicating}
                            fullWidth
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmDuplicate}
                            isLoading={isDuplicating}
                            disabled={!nuevoNombreCopia.trim()}
                            fullWidth
                        >
                            Duplicar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function ActionBtn({ icon, title, onClick, danger = false, disabled = false, tooltip }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                border: 'none', backgroundColor: 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: disabled ? 'var(--text-tertiary)' : (danger ? 'var(--color-error)' : 'var(--text-secondary)'),
                opacity: disabled ? 0.4 : 1, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = danger ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)';
                    e.currentTarget.style.color = danger ? 'var(--color-error)' : 'var(--color-primary)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = danger ? 'var(--color-error)' : 'var(--text-secondary)';
                }
            }}
            title={!tooltip ? title : undefined}
        >
            {tooltip ? (
                <Tooltip content={tooltip}>{icon}</Tooltip>
            ) : icon}
        </button>
    );
}

function InlineEdit({ value, onSave, placeholder, tooltip }: { value: string; onSave: (val: string) => void; placeholder?: string; tooltip?: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onSave(currentValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    const displayValue = value || (isEditing ? '' : placeholder);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isEditing ? (
                <input
                    autoFocus
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%',
                        minWidth: '100px',
                        padding: '6px 8px',
                        fontSize: '12px',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                    }}
                />
            ) : (
                <div
                    onClick={() => setIsEditing(true)}
                    style={{
                        fontSize: '12px',
                        color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        minWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                    {displayValue}
                </div>
            )}
        </div>
    );
}
