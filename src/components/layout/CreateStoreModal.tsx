/**
 * Modal para la creación de una nueva tienda.
 */
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Banknote, AlertCircle } from 'lucide-react';
import { Modal, Button, Input, Select, SelectPais } from '@/components/common';
import { useStoreStore } from '@/store/useStoreStore';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState, useMemo } from 'react';
import { obtenerPaisPorCodigo, cargarPaises, Pais } from '@/services/paisesService';

const storeSchema = z.object({
    nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    pais: z.string().min(2, 'Selecciona un país'),
    moneda: z.string().min(3, 'Selecciona una moneda'),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface CreateStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateStoreModal({ isOpen, onClose }: CreateStoreModalProps) {
    const { tiendas, crearTienda, isLoading, error: storeError } = useStoreStore();
    const { user } = useAuthStore();
    const [allCountries, setAllCountries] = useState<Pais[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<StoreFormData>({
        resolver: zodResolver(storeSchema),
        defaultValues: { nombre: '', pais: 'CO', moneda: 'COP' },
    });

    useEffect(() => {
        cargarPaises().then(setAllCountries);
    }, []);

    const selectedPaisCode = watch('pais');
    const selectedPaisData = useMemo(() =>
        allCountries.find(p => p.codigo_iso_2 === selectedPaisCode),
        [allCountries, selectedPaisCode]);

    useEffect(() => {
        if (selectedPaisData) {
            setValue('moneda', selectedPaisData.moneda_codigo);
        }
    }, [selectedPaisData, setValue]);

    async function onSubmit(data: StoreFormData) {
        if (!user?.id) return;

        const success = await crearTienda({
            nombre: data.nombre,
            pais: data.pais,
            moneda: data.moneda,
            usuario_id: user.id
        });

        if (success) {
            reset();
            onClose();
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Crear Nueva Tienda"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                {storeError && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        borderRadius: '12px',
                        fontSize: '14px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={18} />
                        {storeError}
                    </div>
                )}

                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '10px' }}>
                    Configura tu nueva tienda para empezar a costear tus productos de manera independiente.
                </p>

                <Input
                    label="Nombre de la Tienda"
                    placeholder="Ej: Mi Tienda Online"
                    leftIcon={<Store size={18} />}
                    error={errors.nombre?.message}
                    {...register('nombre')}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Controller
                        name="pais"
                        control={control}
                        render={({ field }) => (
                            <SelectPais
                                label="País de Operación"
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.pais?.message}
                                required
                            />
                        )}
                    />

                    <Input
                        label="Moneda Local"
                        disabled
                        value={selectedPaisData ? `${selectedPaisData.moneda_nombre} (${selectedPaisData.moneda_codigo})` : watch('moneda')}
                        leftIcon={<Banknote size={18} />}
                        placeholder="Autodetectada por el país"
                    />
                </div>

                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Store size={16} color="var(--color-primary)" />
                            Cuota de Tiendas
                        </span>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: (tiendas.length >= (user?.plan?.limits?.stores ?? 1)) ? 'var(--color-error)' : 'var(--color-primary)'
                        }}>
                            {tiendas.length} / {user?.plan?.limits?.stores === -1 ? '∞' : (user?.plan?.limits?.stores ?? 1)}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${user?.plan?.limits?.stores === -1 ? 0 : Math.min((tiendas.length / (user?.plan?.limits?.stores ?? 1)) * 100, 100)}%`,
                            height: '100%',
                            backgroundColor: (tiendas.length >= (user?.plan?.limits?.stores ?? 1)) ? 'var(--color-error)' : 'var(--color-primary)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    {(tiendas.length >= (user?.plan?.limits?.stores ?? 1)) && (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={14} />
                            Has alcanzado el límite de tiendas de tu plan.
                        </p>
                    )}
                </div>

                <div style={{
                    marginTop: '8px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading} style={{ borderColor: 'var(--border-color)' }}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Crear Tienda
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
