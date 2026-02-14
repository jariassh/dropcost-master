import React from 'react';
import { SlideOver } from '../common/SlideOver';
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
    Globe
} from 'lucide-react';
import { Button } from '../common/Button';

interface UserDetailSlideOverProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

export const UserDetailSlideOver: React.FC<UserDetailSlideOverProps> = ({ user, isOpen, onClose }) => {
    if (!user) return null;

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title="Detalles del Usuario"
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{ padding: '32px 24px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Header: Profile Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '24px',
                                fontWeight: 700,
                                boxShadow: 'var(--shadow-lg)'
                            }}>
                                {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                    {user.nombres} {user.apellidos}
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, margin: '4px 0 8px 0' }}>{user.email}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Lifetime Value</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>$0.00</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Tiendas</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>0</p>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Logins</p>
                                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>24</p>
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
                                            {user.plan_id === 'plan_pro' ? 'Plan Pro' : user.plan_id === 'plan_enterprise' ? 'Plan Enterprise' : 'Plan Gratis'}
                                        </h5>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Siguiente cobro: N/A</p>
                                    </div>
                                    <UserStatusBadge status={user.estado_suscripcion} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: '15%', backgroundColor: 'var(--color-primary)' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                        <span>Uso del ciclo: 15%</span>
                                        <span>Renueva: Feb 28, 2026</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Información de Contacto</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                    <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                    <Smartphone size={18} style={{ color: 'var(--text-tertiary)' }} />
                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.telefono || 'No registrado'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                    <Globe size={18} style={{ color: 'var(--text-tertiary)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {user.pais && user.pais.length === 2 ? (
                                            <img
                                                src={`https://flagcdn.com/w40/${user.pais.toLowerCase()}.png`}
                                                alt={user.pais}
                                                style={{ width: '22px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            />
                                        ) : null}
                                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                            {user.pais === 'CO' ? 'Colombia' :
                                                user.pais === 'MX' ? 'México' :
                                                    user.pais === 'EC' ? 'Ecuador' :
                                                        user.pais === 'PE' ? 'Perú' :
                                                            user.pais === 'CL' ? 'Chile' :
                                                                user.pais === 'ES' ? 'España' :
                                                                    user.pais || 'No registrado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Rol del Sistema</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                    <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                                    {user.rol}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Verificación</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: user.email_verificado ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                    {user.email_verificado ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {user.email_verificado ? 'Verificado' : 'Pendiente'}
                                </div>
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
                    <button style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}>
                        <Key size={16} /> Restablecer Contraseña
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Button style={{ borderRadius: '12px', height: '44px' }}>Cambiaro Plan</Button>
                        <button style={{
                            padding: '12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #EF444455',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <Ban size={16} /> Suspender
                        </button>
                    </div>
                </div>
            </div>
        </SlideOver>
    );
};
