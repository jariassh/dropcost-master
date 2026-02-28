/**
 * Página de Gestión de Tienda Específica.
 * Permite editar info básica y configurar integraciones (Shopify, Dropi).
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Save,
    ExternalLink,
    CheckCircle2,
    XCircle,
    ShoppingBag,
    Truck,
    Info,
    Camera
} from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { useToast, Button, Input, Spinner, Badge } from '@/components/common';
import type { Tienda } from '@/types/store.types';
import { ShopifyConfigModal } from '@/components/configuracion/ShopifyConfigModal';

export function StoreManagementPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const { tiendas, actualizarTienda } = useStoreStore();

    const [tienda, setTienda] = useState<Tienda | null>(null);
    const [nombre, setNombre] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isShopifyOpen, setIsShopifyOpen] = useState(false);

    useEffect(() => {
        const found = tiendas.find(t => t.id === id);
        if (found) {
            setTienda(found);
            setNombre(found.nombre);
            setLogoUrl(found.logo_url || '');
        } else if (tiendas.length > 0) {
            navigate('/configuracion');
        }
    }, [id, tiendas, navigate]);

    const handleSaveBasicInfo = async () => {
        if (!tienda) return;
        setIsSaving(true);
        const success = await actualizarTienda(tienda.id, {
            nombre,
            logo_url: logoUrl
        });
        setIsSaving(false);
        if (success) {
            toast.success('Cambios guardados', 'La información de la tienda ha sido actualizada.');
        } else {
            toast.error('Error', 'No se pudieron guardar los cambios.');
        }
    };

    if (!tienda) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', animation: 'fadeIn 300ms ease-out' }}>
            <button
                onClick={() => navigate('/configuracion')}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'none', border: 'none', color: 'var(--text-tertiary)',
                    cursor: 'pointer', marginBottom: '24px', fontWeight: 600, fontSize: '14px'
                }}
            >
                <ArrowLeft size={16} />
                Volver a Mis Tiendas
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                }}>
                    {tienda.logo_url ? (
                        <img src={tienda.logo_url} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Building2 size={32} style={{ color: 'var(--color-primary)' }} />
                    )}
                </div>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Gestionar Tienda: {tienda.nombre}
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px' }}>
                        ID: {tienda.id} • Moneda: {tienda.moneda}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }} className="management-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Información Básica */}
                    <section style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Info size={18} color="var(--color-primary)" />
                            Información de la Tienda
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <Input
                                label="Nombre de la Tienda"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                            />
                            <Input
                                label="URL del Logo"
                                placeholder="https://tu-tienda.com/logo.png"
                                value={logoUrl}
                                onChange={e => setLogoUrl(e.target.value)}
                                helperText="Sube tu logo a un hosting externo y pega aquí la URL directa."
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveBasicInfo}
                                    isLoading={isSaving}
                                    style={{ gap: '8px' }}
                                >
                                    <Save size={16} />
                                    Actualizar Tienda
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Integraciones */}
                    <section>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Integraciones Disponibles</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="integrations-grid">
                            <IntegrationCard
                                title="Shopify"
                                description="Sincroniza tus pedidos y costos de productos automáticamente."
                                icon={<ShoppingBag size={24} />}
                                connected={!!tienda.shopify_domain}
                                color="#95BF47"
                                onClick={() => setIsShopifyOpen(true)}
                            />
                            <IntegrationCard
                                title="Dropi"
                                description="Conecta tu inventario y estados de envío en tiempo real."
                                icon={<Truck size={24} />}
                                connected={false}
                                color="#FF5A00"
                                comingSoon={true}
                            />
                        </div>
                    </section>
                </div>

                <aside>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                        <h4 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '15px' }}>Vista Previa</h4>
                        <div style={{
                            padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px',
                            border: '1px solid var(--card-border)', textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '12px',
                                backgroundColor: 'rgba(var(--color-primary-rgb), 0.05)',
                                margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Building2 size={24} color="var(--color-primary)" />
                                )}
                            </div>
                            <p style={{ margin: 0, fontWeight: 700 }}>{nombre || 'Tienda Nueva'}</p>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>{tienda.moneda} • {tienda.pais}</p>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px', lineHeight: 1.5 }}>
                            Los cambios realizados aquí se reflejarán inmediatamente en tus reportes y simuladores.
                        </p>
                    </div>
                </aside>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 800px) {
                    .management-grid { grid-template-columns: 1fr !important; }
                    .integrations-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <ShopifyConfigModal isOpen={isShopifyOpen} onClose={() => setIsShopifyOpen(false)} />
        </div>
    );
}

function IntegrationCard({ title, description, icon, connected, color, onClick, comingSoon }: any) {
    return (
        <div style={{
            backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: `${color}15`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <Badge variant={connected ? 'success' : 'pill-secondary'}>
                    {connected ? 'Conectado' : (comingSoon ? 'Próximamente' : 'Disponible')}
                </Badge>
            </div>
            <div>
                <h4 style={{ margin: '0 0 4px', fontWeight: 700 }}>{title}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{description}</p>
            </div>
            <Button
                variant={connected ? 'secondary' : 'primary'}
                style={{ marginTop: 'auto', gap: '8px', justifyContent: 'center' }}
                onClick={onClick || (() => alert(`Integración con ${title} próximamente`))}
                disabled={comingSoon}
            >
                {connected ? 'Configurar' : (comingSoon ? 'Muy Pronto' : 'Conectar Cuenta')}
                {!connected && !comingSoon && <ExternalLink size={14} />}
            </Button>
        </div>
    );
}
