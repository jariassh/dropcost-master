import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    Search,
    Download,
    Filter,
    MoreHorizontal,
    Mail,
    Phone,
    MessageSquare,
    MapPin,
    Calendar,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileText,
    Lock,
    ArrowRight
} from 'lucide-react';
import { useStoreStore } from '@/store/useStoreStore';
import { contactService } from '@/services/contactService';
import { ShopifyCliente } from '@/types/contacts.types';
import { Card, Button, Input, Badge, Spinner, EmptyState, Tooltip, PageHeader, useToast } from '@/components/common';
import { ContactDisclaimerModal } from '@/components/modulos/ContactDisclaimerModal';
import { useAuthStore } from '@/store/authStore';
import * as XLSX from 'xlsx';

export default function ContactosPage() {
    const { tiendaActual } = useStoreStore();
    const { user } = useAuthStore();
    const toast = useToast();

    // Estado de datos
    const [contacts, setContacts] = useState<ShopifyCliente[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isModuleEnabled, setIsModuleEnabled] = useState(false);
    const [acceptanceDate, setAcceptanceDate] = useState<string | undefined>();

    // Filtros y paginación
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [paisFilter, setPaisFilter] = useState('');

    // Modales
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [isEnabling, setIsEnabling] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchContacts = async () => {
        if (!tiendaActual) return;

        setLoading(true);
        try {
            const response = await contactService.getContacts(tiendaActual.id, {
                page,
                limit,
                search,
                pais: paisFilter
            });

            setContacts(response.contacts);
            setTotal(response.total);
            setIsModuleEnabled(response.is_module_enabled);
            setAcceptanceDate(response.acceptance_date);

            // Si no está habilitado, pero el usuario entró aquí, mostrar disclaimer si es la primera vez
            if (!response.is_module_enabled && contacts.length === 0) {
                // Podríamos disparar el modal automáticamente o esperar al botón
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [tiendaActual?.id, page, search, paisFilter]);

    const handleEnableModule = async () => {
        if (!tiendaActual || !user) return;

        setIsEnabling(true);
        try {
            await contactService.enableModule(tiendaActual.id, user.id);
            setIsDisclaimerOpen(false);
            fetchContacts();
        } catch (error) {
            console.error('Error enabling module:', error);
        } finally {
            setIsEnabling(false);
        }
    };

    const handleDownload = async (format: 'excel' | 'csv') => {
        if (!tiendaActual || !user || contacts.length === 0) {
            toast.warning('No hay datos para exportar', 'Asegúrate de tener contactos sincronizados.');
            return;
        }

        try {
            const fileName = `contactos_${tiendaActual.nombre.toLowerCase().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}`;

            if (format === 'csv') {
                const headers = ['Nombre', 'Email', 'Telefono', 'Ciudad', 'Departamento', 'Pais', 'Compras', 'Total Valor', 'Ultima Compra'];
                const csvDataArr = contacts.map(c => [
                    `"${c.nombre || ''}"`,
                    `"${c.email || ''}"`,
                    `"${c.telefono || ''}"`,
                    `"${c.ciudad || ''}"`,
                    `"${c.departamento || ''}"`,
                    `"${c.pais || ''}"`,
                    c.numero_compras,
                    c.total_compras_valor || 0,
                    c.ultima_compra_fecha ? new Date(c.ultima_compra_fecha).toLocaleDateString() : ''
                ].join(','));

                // Añadir BOM para que Excel reconozca UTF-8 (ñ y acentos)
                const csvContent = "\uFEFF" + [headers.join(','), ...csvDataArr].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `${fileName}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success('CSV generado correctamente', 'El archivo se ha descargado en tu equipo.');
            } else {
                // Exportación Excel real usando la librería xlsx
                const excelData = contacts.map(c => ({
                    'Nombre': c.nombre || '',
                    'Email': c.email || '',
                    'Telefono': c.telefono || '',
                    'Ciudad': c.ciudad || '',
                    'Departamento': c.departamento || '',
                    'Pais': c.pais || '',
                    'Compras': c.numero_compras,
                    'Total Valor': c.total_compras_valor || 0,
                    'Ultima Compra': c.ultima_compra_fecha ? new Date(c.ultima_compra_fecha).toLocaleDateString() : ''
                }));

                const worksheet = XLSX.utils.json_to_sheet(excelData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
                XLSX.writeFile(workbook, `${fileName}.xlsx`);

                toast.success('Excel generado correctamente', 'El archivo se ha descargado en tu equipo.');
            }

            // Registrar auditoría SIEMPRE (GDPR Compliance)
            await contactService.logDownload({
                tienda_id: tiendaActual.id,
                user_id: user.id,
                formato: format,
                cantidad_registros: contacts.length
            });
        } catch (error) {
            console.error('Error en descarga:', error);
            toast.error('Error en la descarga', 'Hubo un problema al generar el archivo. Por favor reintenta.');
        }
    };

    // Renderizado de tabla (Desktop)
    const renderTable = () => (
        <div style={{ overflowX: 'auto', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                textAlign: 'left'
            }}>
                <thead>
                    <tr style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cliente</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Contacto</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Ubicación</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Compras</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Última Actividad</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact) => (
                        <tr key={contact.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--color-primary-light)',
                                        color: 'var(--color-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600
                                    }}>
                                        {contact.nombre?.[0] || contact.email[0].toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{contact.nombre || 'Sin nombre'}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>ID: {contact.cliente_shopify_id?.split('/').pop() || 'N/A'}</span>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                        <Mail size={14} color="var(--text-tertiary)" />
                                        <span>{contact.email}</span>
                                    </div>
                                    {contact.telefono && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <Phone size={14} color="var(--text-tertiary)" />
                                            <span>{contact.telefono}</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '13px' }}>{contact.ciudad || 'N/A'}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>{contact.pais || 'N/A'}</span>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <Badge variant="pill-purple">
                                    {contact.numero_compras} {contact.numero_compras === 1 ? 'Orden' : 'Órdenes'}
                                </Badge>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                    <Calendar size={14} color="var(--text-tertiary)" />
                                    <span>{contact.ultima_compra_fecha ? new Date(contact.ultima_compra_fecha).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <Button variant="ghost" size="xs">
                                    <MoreHorizontal size={18} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Renderizado de Mobile Cards
    const renderMobileCards = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contacts.map((contact) => (
                <Card key={contact.id} noPadding style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px'
                            }}>
                                {contact.nombre?.[0] || contact.email[0].toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{contact.nombre || 'Sin nombre'}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{contact.pais}</span>
                            </div>
                        </div>
                        <Badge variant="pill-purple" style={{ height: 'fit-content' }}>
                            {contact.numero_compras}
                        </Badge>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <Mail size={14} color="var(--text-tertiary)" />
                            <span style={{ wordBreak: 'break-all' }}>{contact.email}</span>
                        </div>
                        {contact.telefono && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <Phone size={14} color="var(--text-tertiary)" />
                                <span>{contact.telefono}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            <Calendar size={14} />
                            <span>Última compra: {contact.ultima_compra_fecha ? new Date(contact.ultima_compra_fecha).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
                            Ver Detalles
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

            <PageHeader
                title="Gestión de"
                highlight="Contactos"
                description={isModuleEnabled ? `Visualizando ${total} clientes sincronizados post-aceptación.` : 'Habilite el módulo para gestionar los datos de sus clientes.'}
                icon={Users}
                isMobile={isMobile}
                actions={isModuleEnabled && (
                    <>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => handleDownload('excel')} leftIcon={<FileSpreadsheet size={16} />}>
                            Exportar Excel
                        </Button>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => handleDownload('csv')} leftIcon={<FileText size={16} />}>
                            Exportar CSV
                        </Button>
                    </>
                )}
            />

            {!isModuleEnabled && !loading ? (
                /* Pantalla de Bienvenida / Bloqueo */
                <Card style={{ padding: isMobile ? '32px 20px' : '60px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                        <div style={{
                            width: '80px', height: '80px', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
                            position: 'relative'
                        }}>
                            <Users size={40} />
                            <div style={{
                                position: 'absolute', bottom: '-5px', right: '-5px', backgroundColor: 'var(--color-error)',
                                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', border: '4px solid var(--card-bg)'
                            }}>
                                <Lock size={16} />
                            </div>
                        </div>

                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Active el Módulo de Clientes</h2>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Por cumplimiento de normativas de protección de datos (GDPR), DropCost Master no almacena información de contacto de sus clientes de forma predeterminada.
                            </p>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '12px', fontStyle: 'italic' }}>
                                Al activar este módulo, usted asume la responsabilidad legal sobre el tratamiento de estos datos y podrá visualizar, filtrar y descargar la base de datos de sus compradores de Shopify.
                            </p>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setIsDisclaimerOpen(true)}
                            rightIcon={<ArrowRight size={20} />}
                            style={{ marginTop: '12px' }}
                        >
                            Leer y Habilitar Módulo
                        </Button>
                    </div>
                </Card>
            ) : loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
                    <Spinner />
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Cargando base de datos de clientes...</span>
                </div>
            ) : (
                /* Vista de Datos Habilitada */
                <>
                    {/* Filtros Bar */}
                    <Card noPadding style={{ padding: '16px 24px' }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '16px',
                            alignItems: isMobile ? 'stretch' : 'center'
                        }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                                <Input
                                    placeholder="Buscar por nombre, email o teléfono..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ paddingLeft: '40px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', minWidth: isMobile ? 'auto' : '300px' }}>
                                <div style={{ flex: 1 }}>
                                    <select
                                        value={paisFilter}
                                        onChange={(e) => setPaisFilter(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '10px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">Todos los Países</option>
                                        <option value="Colombia">Colombia</option>
                                        <option value="México">México</option>
                                        <option value="Chile">Chile</option>
                                        <option value="Ecuador">Ecuador</option>
                                    </select>
                                </div>
                                <Button variant="secondary" leftIcon={<Filter size={18} />}>
                                    {isMobile ? '' : 'Filtros'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Listado */}
                    <Card noPadding style={{ overflow: 'hidden' }}>
                        {contacts.length > 0 ? (
                            isMobile ? renderMobileCards() : renderTable()
                        ) : (
                            <EmptyState
                                title="No se encontraron contactos"
                                description={search ? "Intenta con otros términos de búsqueda." : "Aún no hay órdenes registradas bajo este módulo."}
                                icon={<Users size={48} />}
                            />
                        )}
                    </Card>

                    {/* Paginación */}
                    {total > limit && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total} contactos
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} leftIcon={<ChevronLeft size={16} />}>
                                    Anterior
                                </Button>
                                <Button variant="secondary" size="sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} rightIcon={<ChevronRight size={16} />}>
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Disclaimer Modal */}
            <ContactDisclaimerModal
                isOpen={isDisclaimerOpen}
                onClose={() => setIsDisclaimerOpen(false)}
                onAccept={handleEnableModule}
                isLoading={isEnabling}
            />

        </div>
    );
}
