import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    History,
    Filter,
    ChevronRight,
    User as UserIcon,
    Calendar,
    Info,
    Layout,
    ShoppingCart,
    Calculator,
    CreditCard,
    Shield,
    LogIn,
    LogOut,
    PlusCircle,
    Edit,
    Trash2,
    RefreshCw,
    Eye,
    ChevronLeft,
    X,
    Check
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import { AuditLog, AuditFilters, AuditAction } from '../../types/audit.types';
import { Button, Spinner, Card } from '../common';
import { supabase } from '@/lib/supabase';

// --- Subcomponente DatePicker Pro ---
const DateRangePicker: React.FC<{
    value: { start: string, end: string },
    onChange: (range: { start: string, end: string }) => void
}> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const shortcuts = [
        { label: 'Hoy', days: 0 },
        { label: 'Últimos 7 días', days: 7 },
        { label: 'Últimos 30 días', days: 30 },
        { label: 'Últimos 90 días', days: 90 },
    ];

    const handleShortcut = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        onChange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rango de Fechas</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: isOpen ? '2px solid var(--color-primary)' : '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    height: '48px'
                }}
            >
                <Calendar size={18} style={{ color: isOpen ? 'var(--color-primary)' : 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '14px', color: value.start ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 500 }}>
                    {value.start ? `${value.start}  →  ${value.end}` : 'Seleccionar fechas'}
                </span>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    zIndex: 100,
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    padding: '20px',
                    width: '400px',
                    animation: 'slideInUp 0.2s ease-out'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '8px' }}>DESDE</p>
                            <input
                                type="date"
                                value={value.start}
                                onChange={(e) => onChange({ ...value, start: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '8px' }}>HASTA</p>
                            <input
                                type="date"
                                value={value.end}
                                onChange={(e) => onChange({ ...value, end: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                        {shortcuts.map(s => (
                            <button
                                key={s.label}
                                onClick={() => handleShortcut(s.days)}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button variant="primary" fullWidth onClick={() => setIsOpen(false)} style={{ borderRadius: '10px' }}>
                            <Check size={18} style={{ marginRight: '8px' }} /> Confirmar
                        </Button>
                        <Button variant="secondary" onClick={() => { onChange({ start: '', end: '' }); setIsOpen(false); }} style={{ borderRadius: '10px' }}>
                            <X size={18} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AuditLogsListProps {
    userId?: string;
    hideUser?: boolean;
}

export const AuditLogsList: React.FC<AuditLogsListProps> = ({ userId, hideUser = false }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<AuditFilters>({
        entidad: '',
        accion: undefined,
        fechaInicio: '',
        fechaFin: '',
        usuario_id: userId
    });
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await auditService.getLogs(filters, page, 15);
            setLogs(response.data);
            setTotalCount(response.count);
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            // Mostrar error en UI si es error de permisos o conexión
            if (error.message) {
                // Check specifically for RLS policy errors which often come as empty data but sometimes as specific codes
                console.warn("Posible error de políticas RLS o conexión:", error.message);
            }
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Update filters when userId changes
    useEffect(() => {
        if (userId) {
            setFilters(prev => ({ ...prev, usuario_id: userId }));
        }
    }, [userId]);

    // Suscripción Realtime
    useEffect(() => {
        const channel = supabase
            .channel('audit_logs_changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'audit_logs' },
                (payload: { new: { usuario_id: string } }) => {
                    // Si estamos en modo usuario, solo refrescar si el log le pertenece
                    if (userId && payload.new.usuario_id !== userId) return;
                    fetchLogs(true);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchLogs, userId]);

    const getModuleConfig = (entidad: string) => {
        switch (entidad) {
            case 'USER': return { label: 'Perfil', icon: UserIcon, color: '#6366F1' };
            case 'STORE': return { label: 'Tiendas', icon: ShoppingCart, color: '#10B981' };
            case 'COSTEO': return { label: 'Costeos', icon: Calculator, color: '#F59E0B' };
            case 'SUBSCRIPTION': return { label: 'Suscripciones', icon: CreditCard, color: '#8B5CF6' };
            case 'SYSTEM': return { label: 'Sistema', icon: Shield, color: '#6B7280' };
            default: return { label: entidad, icon: Layout, color: '#6B7280' };
        }
    };

    const getActionConfig = (action: AuditAction) => {
        if (action === 'LOGIN') return { label: 'Inicio de Sesión', icon: LogIn, color: '#3B82F6' };
        if (action === 'LOGOUT') return { label: 'Cierre de Sesión', icon: LogOut, color: '#6B7280' };
        if (action.includes('CREATE')) return { label: 'Nuevo Registro', icon: PlusCircle, color: '#10B981' };
        if (action.includes('UPDATE')) return { label: 'Actualización', icon: Edit, color: '#F59E0B' };
        if (action.includes('DELETE')) return { label: 'Eliminación', icon: Trash2, color: '#EF4444' };
        return { label: action.replace(/_/g, ' '), icon: Info, color: '#6B7280' };
    };

    const getFriendlyObjectName = (log: AuditLog) => {
        const d = log.detalles || {};
        if (log.entidad === 'STORE') return d.nombre || 'Tienda sin nombre';
        if (log.entidad === 'COSTEO') return d.nombre_producto || 'Cálculo de Costeo';
        if (log.entidad === 'USER') return d.email || log.usuario?.email || 'Perfil Usuario';
        if (log.entidad === 'SUBSCRIPTION') return d.plan || 'Suscripción';
        return `ID: ${log.entidad_id?.substring(0, 8)}...`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });
        return { day, time };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header / Filter Bar */}
            <Card style={{ border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }} className="dc-audit-filter-bar">
                    <div style={{ flex: '1 1 240px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Módulo</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={filters.entidad}
                                onChange={(e) => setFilters(prev => ({ ...prev, entidad: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    paddingRight: '40px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    appearance: 'none',
                                    height: '48px'
                                }}
                            >
                                <option value="">Todos los Módulos</option>
                                <option value="USER">{userId ? 'Perfil' : 'Usuarios'}</option>
                                <option value="STORE">Tiendas</option>
                                <option value="COSTEO">Costeos</option>
                                <option value="SUBSCRIPTION">Suscripciones</option>
                                <option value="SYSTEM">Sistema</option>
                            </select>
                            <ChevronRight size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
                        </div>
                    </div>

                    <DateRangePicker
                        value={{ start: filters.fechaInicio || '', end: filters.fechaFin || '' }}
                        onChange={(range) => setFilters(prev => ({ ...prev, fechaInicio: range.start, fechaFin: range.end }))}
                    />

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                            variant="primary"
                            onClick={() => fetchLogs()}
                            style={{ height: '48px', borderRadius: '12px', padding: '0 24px' }}
                        >
                            <Search size={18} style={{ marginRight: '8px' }} />
                            Filtrar
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setFilters({ entidad: '', accion: undefined, fechaInicio: '', fechaFin: '', usuario_id: userId });
                                setPage(1);
                            }}
                            style={{ height: '48px', borderRadius: '12px', color: 'var(--text-secondary)' }}
                        >
                            <RefreshCw size={18} />
                        </Button>
                    </div>
                </div>
            </Card>

            <div style={{ gap: '32px', alignItems: 'start' }} className={selectedLog ? "dc-audit-grid-active" : "dc-audit-grid"}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Card noPadding style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurso / Referencia</th>
                                        <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Módulo</th>
                                        <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acción</th>
                                        {!hideUser && <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hecho por</th>}
                                        <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '150px' }}>Día y Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={hideUser ? 4 : 5} style={{ padding: '100px', textAlign: 'center' }}><Spinner size="lg" /></td></tr>
                                    ) : logs.length === 0 ? (
                                        <tr><td colSpan={hideUser ? 4 : 5} style={{ padding: '100px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No se encontraron registros activos.</td></tr>
                                    ) : (
                                        logs.map((log) => {
                                            const mod = getModuleConfig(log.entidad);
                                            const act = getActionConfig(log.accion);
                                            const { day, time } = formatDate(log.created_at);
                                            const isSelected = selectedLog?.id === log.id;

                                            return (
                                                <tr
                                                    key={log.id}
                                                    onClick={() => setSelectedLog(log)}
                                                    style={{
                                                        borderBottom: '1px solid var(--border-color)',
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                                                        transition: 'all 0.15s ease'
                                                    } as any}
                                                >
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                                                            {getFriendlyObjectName(log)}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                            ID: {log.entidad_id?.substring(0, 12)}...
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${mod.color}15`, color: mod.color }}>
                                                                <mod.icon size={16} />
                                                            </div>
                                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{mod.label}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <act.icon size={16} style={{ color: act.color }} />
                                                            <span style={{ fontSize: '13px', color: act.color, fontWeight: 800, textTransform: 'uppercase' }}>{act.label}</span>
                                                        </div>
                                                    </td>
                                                    {!hideUser && (
                                                        <td style={{ padding: '16px 24px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '13px', fontWeight: 800, color: isSelected ? '#FFF' : 'var(--color-primary)',
                                                                    border: '1px solid var(--border-color)'
                                                                }}>
                                                                    {log.usuario ? log.usuario.nombres[0] + (log.usuario.apellidos?.[0] || '') : 'S'}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                        {log.usuario ? `${log.usuario.nombres} ${log.usuario.apellidos}` : 'Sistema'}
                                                                    </div>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Web User</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '16px 24px', minWidth: '150px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{day}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{time}</div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mostrando {logs.length} de {totalCount} eventos</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: '10px' }}><ChevronLeft size={18} /> Anterior</Button>
                            <Button variant="secondary" size="sm" disabled={logs.length < 15} onClick={() => setPage(p => p + 1)} style={{ borderRadius: '10px' }}>Siguiente <ChevronRight size={18} /></Button>
                        </div>
                    </div>
                </div>

                {selectedLog && (
                    <Card style={{
                        position: 'sticky', top: '24px', height: 'fit-content',
                        border: '2.5px solid var(--color-primary)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '24px', borderRadius: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Detalles del Evento</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)} style={{ padding: 4, borderRadius: '50%' }}>
                                <X size={24} style={{ color: 'var(--text-tertiary)' }} />
                            </Button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Objeto Afectado</p>
                                <p style={{ margin: 0, fontSize: '16px', color: 'var(--color-primary)', fontWeight: 800 }}>{getFriendlyObjectName(selectedLog)}</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selectedLog.entidad_id}</p>
                            </div>

                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Metadatos de la Acción</p>
                                <pre style={{
                                    margin: 0, fontSize: '13px', color: 'var(--text-primary)',
                                    backgroundColor: 'var(--bg-primary)', padding: '14px', borderRadius: '10px',
                                    border: '1.5px solid var(--border-color)', overflowX: 'auto', maxHeight: '350px',
                                    fontFamily: 'JetBrains Mono, Menlo, monospace', lineHeight: '1.6'
                                }}>
                                    {JSON.stringify(selectedLog.detalles, null, 2)}
                                </pre>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 900 }}>DIRECCIÓN IP</p>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedLog.ip_address || '127.0.0.1'}</p>
                                </div>
                                <div style={{ padding: '14px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 900 }}>ID EVENTO</p>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedLog.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>

                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>User Agent</p>
                                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6', wordBreak: 'break-all' }}>{selectedLog.user_agent}</p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
