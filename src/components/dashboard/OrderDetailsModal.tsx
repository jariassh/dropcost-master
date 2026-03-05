import React from 'react';
import { ShoppingBag, User, Phone, MapPin, FileText, Tag, Calendar, CreditCard, Truck } from 'lucide-react';
import { Button, Badge } from '@/components/common';
import { DashboardOrder } from '@/types/dashboard';
import { formatSmartCurrency } from '@/utils/currencyUtils';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: DashboardOrder | null;
    isRestricted?: boolean;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, isRestricted }) => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isOpen || !order) return null;

    const customer = order.customer_details || {};
    const address = customer.address || {};

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }} onClick={onClose}>
            <div
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: isMobile ? '12px' : '20px',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: isMobile ? '95vh' : '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-color)',
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: isMobile ? '16px 20px' : '24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--bg-primary)',
                    zIndex: 2
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--color-primary)15',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShoppingBag size={20} color="var(--color-primary)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                Orden {order.order_number}
                            </h2>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                                {isMobile ? new Date(order.date).toLocaleDateString() : `Recibida el ${new Date(order.date).toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Badge variant={order.status === 'paid' ? 'success' : 'warning'}>
                            {order.status.toUpperCase()}
                        </Badge>
                        <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Información del Cliente */}
                    <Section title="Información del Cliente" icon={<User size={16} />}>
                        {isRestricted ? (
                            <RestrictedContentMessage />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                                <InfoField
                                    label="Nombre Completo"
                                    value={`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || order.cliente_nombre || 'N/A'}
                                />
                                <InfoField
                                    label="Correo Electrónico"
                                    value={customer.email || order.cliente_email || 'N/A'}
                                />
                                <InfoField
                                    label="WhatsApp / Teléfono"
                                    value={customer.phone || order.cliente_telefono || 'N/A'}
                                    icon={<Phone size={12} />}
                                />
                                <InfoField
                                    label="Campañas Relacionadas"
                                    value={order.campaign_name || 'Atribución Directa'}
                                />
                            </div>
                        )}
                    </Section>

                    {/* Dirección de Envío */}
                    <Section title="Dirección de Envío" icon={<MapPin size={16} />}>
                        {isRestricted ? (
                            <RestrictedContentMessage />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                <InfoField
                                    label="Dirección / Referencia"
                                    value={address.address1 || order.cliente_direccion || 'Información en notas'}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                                    <InfoField
                                        label="Ciudad"
                                        value={address.city || order.cliente_ciudad || 'N/A'}
                                    />
                                    <InfoField
                                        label="Departamento"
                                        value={address.province || order.cliente_departamento || 'N/A'}
                                    />
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Notas de la Orden */}
                    <Section title="Notas de Shopify" icon={<FileText size={16} />}>
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '10px',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            lineHeight: '1.5',
                            borderLeft: '4px solid var(--color-primary)'
                        }}>
                            {order.notas || 'Sin notas especiales para este pedido.'}
                        </div>
                    </Section>

                    {/* Meta Atributos (Documento, etc) */}
                    {customer.note_attributes && customer.note_attributes.length > 0 && (
                        <Section title="Información Adicional" icon={<Tag size={16} />}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {customer.note_attributes.map((attr: any, i: number) => (
                                    <InfoField key={i} label={attr.name} value={attr.value} />
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Footer / Resumen Financiero */}
                    <div style={{
                        marginTop: '32px',
                        padding: '20px',
                        backgroundColor: 'var(--color-primary)05',
                        borderRadius: '16px',
                        border: '1px solid var(--color-primary)20'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total de la Orden</span>
                            <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-primary)' }}>
                                {formatSmartCurrency(order.total)}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} variant="secondary">Cerrar Detalle</Button>
                </div>
            </div>
            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
            <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: 0 }}>
                {title}
            </h3>
        </div>
        {children}
    </div>
);

const InfoField = ({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) => (
    <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
            {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {icon && <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>}
            {value}
        </div>
    </div>
);

const RestrictedContentMessage = () => (
    <div style={{
        padding: '16px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px dashed var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'center'
    }}>
        <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
            Información Reservada
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, maxWidth: '250px' }}>
            Habilite el Módulo de Contactos para ver los datos personales de sus clientes.
        </p>
    </div>
);
