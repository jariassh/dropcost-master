import React, { useState, useEffect } from 'react';
import { SlideOver } from '../common/SlideOver';
import { auditService } from '../../services/auditService';
import { AuditLog } from '../../types/audit.types';
import { User } from '../../types/user.types';
import { UserStatusBadge } from './UserStatusBadge';
import {
    Mail,
    Shield,
    Zap,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Layout,
    Key,
    Ban,
    User as UserIcon,
    Smartphone,
    Globe,
    RefreshCw,
    X,
    Edit2,
    Save,
    RotateCcw
} from 'lucide-react';
import { SmartPhoneInput } from '../common/SmartPhoneInput';
import { Button } from '../common/Button';
import { AssignPlanModal } from './AssignPlanModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { obtenerPaisPorCodigo, Pais } from '../../services/paisesService';
import { userService } from '../../services/userService';
import { storeService } from '../../services/storeService';
import { resendVerificationEmail, requestPasswordReset } from '../../services/authService';
import { useToast } from '../common/Toast';

import { Plan } from '../../types/plans.types';

interface UserDetailSlideOverProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onUserUpdate?: () => void;
    plans?: Plan[];
}

export const UserDetailSlideOver: React.FC<UserDetailSlideOverProps> = ({ user, isOpen, onClose, onUserUpdate, plans = [] }) => {
    const [activity, setActivity] = useState<AuditLog[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [countryData, setCountryData] = useState<Pais | null>(null);
    const [loadingAction, setLoadingAction] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [saving, setSaving] = useState(false);
    const [totalStores, setTotalStores] = useState<number | null>(null);
    const [totalLogins, setTotalLogins] = useState<number | null>(null);
    const [totalCosteos, setTotalCosteos] = useState<number | null>(null);
    const [loadingReset, setLoadingReset] = useState(false);
    const toast = useToast();

    const fetchActivity = async () => {
        if (!user) return;
        setLoadingActivity(true);
        try {
            // Fetch last 10 logs for this user
            const response = await auditService.getLogs({ usuario_id: user.id }, 1, 10);
            setActivity(response.data);

            // Fetch real stats
            const tiendas = await storeService.getTiendas(user.id);
            setTotalStores(tiendas.length);

            // Fetch real login count from audit logs
            const loginLogs = await auditService.getLogs({ usuario_id: user.id, accion: 'LOGIN' }, 1, 1);
            setTotalLogins(loginLogs.count);

            setTotalCosteos(0);
        } catch (error) {
            console.error('Error fetching user activity/stats:', error);
        } finally {
            setLoadingActivity(false);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchActivity();
            setEditForm({ ...user });
            if (user.pais) {
                obtenerPaisPorCodigo(user.pais).then(setCountryData);
            } else {
                setCountryData(null);
            }
        } else {
            setIsEditing(false);
        }
    }, [isOpen, user?.id, user?.pais]);

    const getActionColor = (action: string) => {
        if (action === 'LOGIN') return '#3B82F6';
        if (action.includes('CREATE')) return '#10B981';
        if (action.includes('UPDATE')) return '#F59E0B';
        if (action.includes('DELETE')) return '#EF4444';
        return '#6B7280';
    };

    const getFriendlyActionLabel = (log: AuditLog) => {
        const actionMap: Record<string, string> = {
            'LOGIN': 'Inicio de Sesión',
            'LOGOUT': 'Cierre de Sesión',
            'CREATE_STORE': 'Creó una nueva tienda',
            'UPDATE_STORE': 'Actualizó tienda',
            'DELETE_STORE': 'Eliminó tienda',
            'CREATE_COSTEO': 'Nuevo cálculo de costeo',
            'UPDATE_PROFILE': 'Actualizó perfil',
            'CHANGE_PASSWORD': 'Cambió contraseña'
        };
        return actionMap[log.accion] || log.accion.replace(/_/g, ' ');
    };

    const getFunctionTarget = (log: AuditLog) => {
        const details = log.detalles || {};
        if (log.entidad === 'STORE') return details.nombre || 'Tienda';
        if (log.entidad === 'COSTEO') return details.nombre_producto || 'Cálculo';
        if (log.accion === 'LOGIN') return log.ip_address || 'IP desconocida';
        if (log.entidad === 'USER') return 'Datos de cuenta';
        return log.entidad;
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'Hace un momento';
    };

    const handleResendVerification = async () => {
        if (!user || user.email_verificado) return;
        setLoadingAction(true);
        try {
            const response = await resendVerificationEmail(user.email);
            if (response.success) {
                toast.success('Éxito', 'Email de verificación reenviado con éxito');
            } else {
                toast.error('Error', response.error || 'Error al reenviar el email');
            }
        } catch (error) {
            toast.error('Error', 'Error al conectar con el servidor');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleToggleSuspension = async () => {
        if (!user) return;
        setIsConfirmOpen(true);
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setLoadingReset(true);
        try {
            // Use requestPasswordReset from authService which triggers branded MJML email
            const result = await requestPasswordReset({ email: user.email });
            if (result.success) {
                toast.success('Email enviado', 'Se han enviado las instrucciones de recuperación (Plantilla Branded).');
            } else {
                toast.error('Error', result.error || 'No se pudo enviar el correo.');
            }
        } catch (error) {
            toast.error('Error', 'Error de conexión.');
        } finally {
            setLoadingReset(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const success = await userService.updateUser(user.id, editForm);
            if (success) {
                toast.success('Usuario actualizado', 'Los cambios se han guardado correctamente.');
                setIsEditing(false);
                onUserUpdate?.();
            } else {
                toast.error('Error', 'No se pudieron guardar los cambios.');
            }
        } catch (error) {
            toast.error('Error', 'Error de conexión al guardar cambios.');
        } finally {
            setSaving(false);
        }
    };

    const executeToggleSuspension = async () => {
        if (!user) return;
        const isCurrentlySuspended = user.estado_suscripcion === 'suspendida';
        const newStatus = isCurrentlySuspended ? 'activa' : 'suspendida';

        setLoadingAction(true);
        setIsConfirmOpen(false);
        try {
            const success = await userService.updateUserStatus(user.id, newStatus);
            if (success) {
                toast.success('Usuario actualizado', `Usuario ${isCurrentlySuspended ? 'activado' : 'suspendido'} correctamente`);
                onUserUpdate?.();
            } else {
                toast.error('Ocurrió un problema', 'No se pudo actualizar el estado del usuario');
            }
        } catch (error) {
            toast.error('Error de conexión', 'No se pudo contactar con el servidor');
        } finally {
            setLoadingAction(false);
        }
    };

    if (!user) return null;

    // Calculate usage cycle dynamically
    const calculateUsage = () => {
        if (!user) return 0;
        if (user.plan_id === 'plan_free' || !user.plan_id) return 0;

        // Logical usage: based on remaining days. 
        // We calculate it locally to ensure it's fresh after an update.
        let remaining = user.dias_restantes;
        if (user.fecha_vencimiento_plan) {
            const now = new Date();
            const expiry = new Date(user.fecha_vencimiento_plan);
            remaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        const currentRemaining = remaining ?? 0;

        // If remaining is more than 30 days (extended or annual plan), 
        // usage cycle (monthly) is effectively 0% for the current period.
        if (currentRemaining > 30) return 0;
        if (currentRemaining <= 0) return 100;

        const total = 30; // Standard monthly cycle
        const usage = Math.max(0, Math.min(100, Math.round(((total - currentRemaining) / total) * 100)));
        return usage;
    };

    const usage = calculateUsage();
    const expiryDate = user.fecha_vencimiento_plan ? new Date(user.fecha_vencimiento_plan).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Detalles del Usuario"
            hideHeader={true}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif"
            }}>
                {/* Header: Profile Info (Fixed) */}
                <div style={{ padding: '32px 24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            color: 'var(--text-tertiary)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '20px',
                            background: user?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: 700,
                            boxShadow: 'var(--shadow-lg)',
                            overflow: 'hidden'
                        }}>
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={`${user.nombres} ${user.apellidos}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <>{user?.nombres.charAt(0)}{user?.apellidos.charAt(0)}</>
                            )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input
                                        value={editForm.nombres}
                                        onChange={(e) => setEditForm({ ...editForm, nombres: e.target.value })}
                                        placeholder="Nombres"
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px' }}
                                    />
                                    <input
                                        value={editForm.apellidos}
                                        onChange={(e) => setEditForm({ ...editForm, apellidos: e.target.value })}
                                        placeholder="Apellidos"
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px' }}
                                    />
                                </div>
                            ) : (
                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                    {user.nombres} {user.apellidos}
                                </h3>
                            )}
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, margin: '4px 0 8px 0' }}>{user.email}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {user.email_verificado && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handlePasswordReset}
                                            disabled={loadingReset}
                                            style={{ height: '32px', padding: '0 12px', borderRadius: '8px' }}
                                        >
                                            {loadingReset ? '...' : <><Key size={14} style={{ marginRight: '6px' }} /> Recuperación Branded</>}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{
                                    padding: '2px 8px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'var(--text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    ID USUARIO: #{user.id.substring(0, 8)}
                                </span>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {isEditing ? (
                                        <>
                                            <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)} style={{ height: '32px', padding: '0 12px', borderRadius: '8px' }}>
                                                <X size={14} style={{ marginRight: '6px' }} /> Cancelar
                                            </Button>
                                            <Button size="sm" onClick={handleSaveChanges} disabled={saving} style={{ height: '32px', padding: '0 12px', borderRadius: '8px' }}>
                                                {saving ? '...' : <><Save size={14} style={{ marginRight: '6px' }} /> Guardar</>}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)} style={{ height: '32px', padding: '0 12px', borderRadius: '8px' }}>
                                            <Edit2 size={14} style={{ marginRight: '6px' }} /> Editar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Lifetime Value</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>$0.00</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Tiendas</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {totalStores !== null ? totalStores : '...'}
                                </p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Logins</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {totalLogins !== null ? totalLogins : '...'}
                                </p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Registrado</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {new Date(user.fecha_registro).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Current Subscription */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                                <CheckCircle2 size={16} />
                                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suscripción Actual</h4>
                            </div>
                            <div style={{
                                padding: '20px',
                                background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
                                border: '1px solid var(--border-color)',
                                borderRadius: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <h5 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                            {plans.find(p => p.slug === user.plan_id)?.name || (user.plan_id === 'plan_pro' ? 'Plan Pro' : user.plan_id === 'plan_enterprise' ? 'Plan Enterprise' : 'Plan Gratis')}
                                        </h5>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Siguiente cobro: N/A</p>
                                    </div>
                                    <UserStatusBadge status={user.estado_suscripcion || 'inactiva'} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${usage}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.5s ease-out' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                        <span>Uso del ciclo: {usage}%</span>
                                        <span>Expira: {expiryDate}</span>
                                    </div>
                                    {isEditing && (
                                        <div style={{ marginTop: '12px' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Fecha Vencimiento</p>
                                            <input
                                                type="date"
                                                value={editForm.fecha_vencimiento_plan ? new Date(editForm.fecha_vencimiento_plan).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditForm({ ...editForm, fecha_vencimiento_plan: e.target.value })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Information Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Información de Contacto</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {isEditing ? (
                                    <>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <input
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                    placeholder="Correo Electrónico"
                                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '14px' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <SmartPhoneInput
                                                    value={editForm.telefono || ''}
                                                    onChange={(val, iso) => setEditForm({ ...editForm, telefono: val, pais: iso })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                            <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                            <Smartphone size={18} style={{ color: 'var(--text-tertiary)' }} />
                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.telefono || 'No registrado'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                            {countryData ? (
                                                <img
                                                    src={`https://flagcdn.com/w40/${countryData.codigo_iso_2.toLowerCase()}.png`}
                                                    alt={countryData.nombre_es}
                                                    style={{ width: '22px', height: '15px', borderRadius: '2px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Globe size={18} style={{ color: 'var(--text-tertiary)' }} />
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {countryData ? (
                                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                                        {countryData.nombre_es}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                                        {user.pais || 'No registrado'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Security */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Rol del Sistema</p>
                                {isEditing ? (
                                    <select
                                        value={editForm.rol}
                                        onChange={(e) => setEditForm({ ...editForm, rol: e.target.value as any })}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}
                                    >
                                        <option value="cliente">Cliente</option>
                                        <option value="lider">Líder</option>
                                        <option value="admin">Administrador</option>
                                        <option value="superadmin">Super Admin</option>
                                    </select>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                        <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                                        {user.rol}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Verificación</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: user.email_verificado ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                        {user.email_verificado ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                        {user.email_verificado ? 'Verificado' : 'Pendiente'}
                                    </div>
                                    {!user.email_verificado && (
                                        <button
                                            onClick={handleResendVerification}
                                            disabled={loadingAction}
                                            style={{
                                                fontSize: '11px',
                                                color: 'var(--color-primary)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {loadingAction ? '...' : 'Reenviar Email'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Activity Timeline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h4 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actividad Reciente</h4>
                                <Button variant="ghost" size="sm" onClick={() => fetchActivity()} disabled={loadingActivity}>
                                    <RefreshCw size={14} style={{ animation: loadingActivity ? 'spin 1s linear infinite' : 'none' }} />
                                </Button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {loadingActivity ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>Cargando actividad...</div>
                                ) : activity.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                        Sin actividad registrada recientemente.
                                    </div>
                                ) : (
                                    activity.map((log, index) => (
                                        <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                            {/* Línea conectora */}
                                            {index !== activity.length - 1 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '6px',
                                                    top: '24px',
                                                    bottom: '-16px',
                                                    width: '2px',
                                                    backgroundColor: 'var(--border-color)'
                                                }} />
                                            )}

                                            {/* Punto Timeline */}
                                            <div style={{
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--bg-primary)',
                                                border: `2px solid ${getActionColor(log.accion)}`,
                                                flexShrink: 0,
                                                marginTop: '5px',
                                                zIndex: 1
                                            }} />

                                            {/* Contenido */}
                                            <div style={{ paddingBottom: '24px', flex: 1 }}>
                                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                    {getFriendlyActionLabel(log)}
                                                </p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                                    {getFunctionTarget(log)}
                                                </p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {getTimeAgo(log.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '24px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <button
                        onClick={handlePasswordReset}
                        disabled={loadingAction}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            cursor: loadingAction ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            opacity: loadingAction ? 0.7 : 1
                        }}
                    >
                        <Key size={16} /> {loadingAction ? 'Enviando...' : 'Restablecer Contraseña'}
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Button
                            style={{ borderRadius: '12px', height: '44px' }}
                            onClick={() => setIsAssignModalOpen(true)}
                        >
                            Cambiar Plan
                        </Button>
                        <button
                            disabled={loadingAction}
                            onClick={handleToggleSuspension}
                            style={{
                                padding: '12px',
                                backgroundColor: 'transparent',
                                border: `1px solid ${user.estado_suscripcion === 'suspendida' ? 'var(--color-success)55' : '#EF444455'}`,
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: user.estado_suscripcion === 'suspendida' ? 'var(--color-success)' : '#EF4444',
                                cursor: loadingAction ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: loadingAction ? 0.7 : 1
                            }}
                        >
                            {user.estado_suscripcion === 'suspendida' ? (
                                <><CheckCircle2 size={16} /> Activar</>
                            ) : (
                                <><Ban size={16} /> Suspender</>
                            )}
                        </button>
                    </div>
                </div>

                <AssignPlanModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    user={user}
                    onSuccess={() => {
                        // In a real app we would refresh user data or show toast
                        setIsAssignModalOpen(false);
                        onUserUpdate?.();
                    }}
                />

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    title={user.estado_suscripcion === 'suspendida' ? 'Activar Usuario' : 'Suspender Usuario'}
                    description={user.estado_suscripcion === 'suspendida'
                        ? `¿Estás seguro de que deseas reactivar la cuenta de ${user.nombres}? Volverá a tener acceso completo.`
                        : `¿Estás seguro de que deseas suspender a ${user.nombres}? No podrá iniciar sesión hasta que lo reactives.`
                    }
                    confirmLabel={user.estado_suscripcion === 'suspendida' ? 'Activar Cuenta' : 'Suspender Cuenta'}
                    variant={user.estado_suscripcion === 'suspendida' ? 'info' : 'danger'}
                    onConfirm={executeToggleSuspension}
                    onCancel={() => setIsConfirmOpen(false)}
                    isLoading={loadingAction}
                />
            </div>
        </SlideOver>
    );
};
