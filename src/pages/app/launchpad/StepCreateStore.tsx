import React, { useState, useEffect } from 'react';
import { Store, Plus, ArrowRight } from 'lucide-react';
import { Card, Button, Input, useToast, Spinner } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Mapeo de código ISO a nombre de país
const COUNTRY_NAMES: Record<string, string> = {
    CO: 'Colombia', MX: 'México', EC: 'Ecuador', PE: 'Perú', CL: 'Chile',
    US: 'Estados Unidos', ES: 'España', AR: 'Argentina', BR: 'Brasil', VE: 'Venezuela'
};

interface StepCreateStoreProps {
    onComplete: (tiendaId: string) => void;
}

export function StepCreateStore({ onComplete }: StepCreateStoreProps) {
    const { user } = useAuthStore();
    const toast = useToast();

    const [existingStores, setExistingStores] = useState<any[]>([]);
    const [isFetchingStores, setIsFetchingStores] = useState(true);
    const [mode, setMode] = useState<'select' | 'create'>('select');

    // Create Form State
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [pais, setPais] = useState('CO');
    const [moneda, setMoneda] = useState('COP');
    const [isLoading, setIsLoading] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        setIsFetchingStores(true);
        try {
            const { data, error } = await supabase
                .from('tiendas' as any)
                .select('*')
                .eq('usuario_id', user?.id)
                .eq('active', true);

            if (data && data.length > 0) {
                setExistingStores(data);
                setMode('select');
            } else {
                setMode('create');
            }
        } catch (err) {
            console.error("Error fetching stores:", err);
        } finally {
            setIsFetchingStores(false);
        }
    };

    const handleSelectStore = (tiendaId: string) => {
        onComplete(tiendaId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            toast.error('Campo requerido', 'Por favor ingresa un nombre para tu tienda.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tiendas' as any)
                .insert({
                    usuario_id: user?.id,
                    nombre,
                    descripcion,
                    pais,
                    moneda,
                    active: true
                })
                .select()
                .single();

            if (error) throw error;

            const row = data as any;
            toast.success('¡Tienda Creada!', 'Procedamos a conectar tus herramientas.');
            onComplete(row.id);
        } catch (err: any) {
            toast.error('Error', err.message || 'No se pudo crear la tienda.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetchingStores) {
        return (
            <div style={{
                padding: '100px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%'
            }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ padding: '0 8px', marginBottom: '8px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '12px' : '0',
                    width: '100%'
                }}>
                    <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                        {mode === 'select' ? 'Selecciona tu Tienda' : 'Configura tu Tienda'}
                    </h2>
                    {existingStores.length > 0 && (
                        <div style={{
                            padding: '6px 12px', borderRadius: '20px', backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                            border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {existingStores.length} {existingStores.length === 1 ? 'Tienda detectada' : 'Tiendas detectadas'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {mode === 'select' ? (
                <Card style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                        {existingStores.map(store => (
                            <div
                                key={store.id}
                                onClick={() => handleSelectStore(store.id)}
                                style={{
                                    padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)',
                                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
                                    alignItems: 'center', justifyContent: 'space-between',
                                    backgroundColor: 'var(--bg-secondary)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
                                        color: 'var(--color-primary)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 750, fontSize: '16px' }}>{store.nombre}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <img
                                                src={`https://flagcdn.com/w20/${(store.pais || 'co').toLowerCase()}.png`}
                                                width="16"
                                                height="12"
                                                style={{ borderRadius: '2px', objectFit: 'cover' }}
                                                alt={COUNTRY_NAMES[store.pais] || store.pais}
                                            />
                                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                {COUNTRY_NAMES[store.pais] || store.pais} • {store.moneda}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={20} color="var(--text-tertiary)" />
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', textAlign: 'center' }}>
                        <Button variant="ghost" onClick={() => setMode('create')} style={{ gap: '8px', color: 'var(--text-secondary)' }}>
                            <Plus size={18} /> Crear Nueva Tienda
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card style={{ padding: '32px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Input
                            label="Nombre de la Tienda"
                            placeholder="Ej: Mi Tienda Dropshipping"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />

                        <Input
                            label="Descripción (Opcional)"
                            placeholder="Ej: Tienda enfocada en hogar y tecnología"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>País</label>
                                <select
                                    value={pais}
                                    onChange={(e) => setPais(e.target.value)}
                                    style={{
                                        padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none'
                                    }}
                                >
                                    <option value="CO">Colombia</option>
                                    <option value="MX">México</option>
                                    <option value="EC">Ecuador</option>
                                    <option value="PE">Perú</option>
                                    <option value="CL">Chile</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Moneda</label>
                                <select
                                    value={moneda}
                                    onChange={(e) => setMoneda(e.target.value)}
                                    style={{
                                        padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none'
                                    }}
                                >
                                    <option value="COP">COP</option>
                                    <option value="USD">USD</option>
                                    <option value="MXN">MXN</option>
                                    <option value="CLP">CLP</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginTop: '12px' }}>
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                                style={{ height: '52px', borderRadius: '14px' }}
                            >
                                Crear Tienda y Continuar
                            </Button>
                            {existingStores.length > 0 && (
                                <Button
                                    variant="ghost"
                                    type="button"
                                    onClick={() => setMode('select')}
                                    style={{ borderRadius: '14px' }}
                                >
                                    Ver mis tiendas
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
}
