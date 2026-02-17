import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast, Badge, Modal, Input, Spinner, ConfirmDialog } from '@/components/common';
import {
    Mail,
    Save,
    Eye,
    Info,
    Code,
    Type,
    Layout,
    CheckCircle2,
    Tag,
    ChevronDown,
    Zap,
    Folder,
    Clock,
    List as ListIcon,
    MoreVertical,
    Filter,
    Plus,
    FileEdit,
    Search,
    ArrowLeft,
    MoreHorizontal,
    ChevronRight,
    Copy,
    Trash2,
    Archive,
    ExternalLink,
    MoveUp,
    FolderInput,
    Edit3
} from 'lucide-react';
import { configService } from '@/services/configService';

interface EmailItem {
    id: string;
    name: string;
    slug: string;
    subject: string;
    html_content: string;
    description: string;
    variables: string[];
    updated_at: string;
    is_folder?: boolean;
    parent_id?: string | null;
    status: 'activo' | 'archivado';
    trigger_event?: string;
    updated_by_name?: string;
}

export function AdminEmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailItem[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'pc'>('pc');
    const [showVariablesSubject, setShowVariablesSubject] = useState(false);
    const [showVariablesBody, setShowVariablesBody] = useState(false);

    // UI State
    const [viewMode, setViewMode] = useState<'recent' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'activo' | 'archivado' | 'all'>('all');
    const [navigationPath, setNavigationPath] = useState<string[]>([]); // Array of IDs
    const [showFilters, setShowFilters] = useState(false);

    // Create States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', slug: '', description: '', subject: '', trigger_event: '' });
    const [isCreating, setIsCreating] = useState(false);

    // Actions State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [itemToManage, setItemToManage] = useState<EmailItem | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    const toast = useToast();

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_{2,}/g, "_")
            .replace(/^_|_$/g, "")
            .toUpperCase();
    };

    const insertVariable = (field: 'subject' | 'html_content', variableName: string) => {
        if (!selectedTemplate) return;

        const elementId = field === 'subject' ? 'subject-input' : 'body-textarea';
        const element = document.getElementById(elementId) as HTMLInputElement | HTMLTextAreaElement;

        if (!element) return;

        const start = element.selectionStart || 0;
        const end = element.selectionEnd || 0;
        const text = selectedTemplate[field];
        const variable = `{{${variableName}}}`;

        const newText = text.substring(0, start) + variable + text.substring(end);

        setSelectedTemplate({
            ...selectedTemplate,
            [field]: newText
        });

        // Cerrar menús
        setShowVariablesSubject(false);
        setShowVariablesBody(false);

        // Devolver foco y posicionar cursor
        setTimeout(() => {
            element.focus();
            const newPos = start + variable.length;
            element.setSelectionRange(newPos, newPos);
        }, 10);
    };

    const categorizedVariables = {
        'Usuario': [
            { name: 'nombres', label: 'Nombres del Usuario' },
            { name: 'apellidos', label: 'Apellidos del Usuario' },
            { name: 'email', label: 'Email Principal' },
            { name: 'telefono', label: 'Teléfono de Contacto' },
            { name: 'pais', label: 'País de Residencia' },
            { name: 'wallet_saldo', label: 'Saldo en Wallet' },
            { name: 'codigo_referido_personal', label: 'Su Código de Invitación' },
            { name: 'fecha_registro', label: 'Fecha de Registro' }
        ],
        'Suscripción': [
            { name: 'plan_nombre', label: 'Nombre del Plan Actual' },
            { name: 'plan_precio', label: 'Precio del Plan' },
            { name: 'plan_expiracion', label: 'Fecha de Expiración' },
            { name: 'estado_suscripcion', label: 'Estado (Activa/Pendiente)' }
        ],
        'Tienda': [
            { name: 'tienda_nombre', label: 'Nombre de la Tienda' },
            { name: 'tienda_pais', label: 'País de la Tienda' },
            { name: 'tienda_moneda', label: 'Moneda (COP, USD, etc)' }
        ],
        'Financiero': [
            { name: 'producto_nombre', label: 'Nombre del Producto (Último)' },
            { name: 'producto_sku', label: 'SKU del Producto' },
            { name: 'producto_precio_sugerido', label: 'Precio Sugerido' },
            { name: 'producto_utilidad_neta', label: 'Utilidad Neta Estimada' }
        ],
        'Referidos': [
            { name: 'lider_nombre', label: 'Nombre de su Líder' },
            { name: 'total_referidos', label: 'Total de Invitados' },
            { name: 'total_comisiones', label: 'Comisiones Totales' }
        ],
        'Seguridad': [
            { name: 'codigo', label: 'Código de Verificación (OTP)' }
        ]
    };

    const VariableList = ({ onSelect }: { onSelect: (v: string) => void }) => {
        const [search, setSearch] = useState('');

        const filteredCategories = Object.entries(categorizedVariables).reduce((acc, [category, vars]) => {
            const matches = vars.filter(v =>
                v.label.toLowerCase().includes(search.toLowerCase()) ||
                v.name.toLowerCase().includes(search.toLowerCase())
            );
            if (matches.length > 0) acc[category] = matches;
            return acc;
        }, {} as any);

        return (
            <div
                className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
            >
                {/* Buscador Dinámico */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Buscar campo (ej: nombre...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                fontSize: '12px',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                            className="focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto scrollbar-custom">
                    {Object.entries(filteredCategories).length > 0 ? (
                        Object.entries(filteredCategories).map(([category, vars]: [string, any]) => (
                            <div key={category} className="border-b border-[var(--border-color)] last:border-0">
                                <div style={{ padding: '10px 24px', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', opacity: 0.8 }}>
                                    <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{category}</span>
                                </div>
                                {vars.map((v: any) => (
                                    <button
                                        key={v.name}
                                        onClick={() => onSelect(v.name)}
                                        style={{
                                            width: '100%',
                                            padding: '14px 24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 200ms ease',
                                            border: 'none',
                                            textAlign: 'left'
                                        }}
                                        className="group hover:bg-[var(--color-primary-light)]"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                            <div style={{ padding: '7px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="group-hover:bg-white transition-colors">
                                                <Zap size={13} className="text-[var(--color-primary)]" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                                    {v.label}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                                    {"{{"}{v.name}{"}}"}
                                                </span>
                                            </div>
                                        </div>
                                        <Tag size={12} className="opacity-0 group-hover:opacity-40 text-[var(--color-primary)] transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center space-y-3">
                            <div className="inline-flex p-3 bg-[var(--bg-secondary)] rounded-full border border-[var(--border-color)]">
                                <Search size={24} className="text-[var(--text-tertiary)]" />
                            </div>
                            <p className="text-sm text-[var(--text-tertiary)] font-medium">No encontramos campos con "{search}"</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const deviceWidths = {
        mobile: '375px',
        tablet: '768px',
        pc: '1000px'
    };

    async function loadTemplates() {
        try {
            setIsLoading(true);
            const data = await configService.getEmailTemplates() as any;
            setTemplates(data);
        } catch (error) {
            toast.error('Error', 'No se pudieron cargar las plantillas de email.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!selectedTemplate) return;
        try {
            setIsSaving(true);
            await configService.updateEmailTemplate(selectedTemplate.id, {
                subject: selectedTemplate.subject,
                html_content: selectedTemplate.html_content,
                description: selectedTemplate.description
            });

            setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t));

            toast.success('¡Guardado!', 'La plantilla se ha actualizado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo guardar la plantilla.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleCreateTemplate() {
        if (!newItem.slug) return toast.error('Error', 'El slug es obligatorio.');
        try {
            setIsCreating(true);
            const data = await configService.createEmailTemplate({
                ...newItem,
                html_content: '<html><body> Nueva Plantilla </body></html>',
                variables: [],
                is_folder: false,
                parent_id: navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null
            }) as any;
            setTemplates([...templates, data]);
            setIsCreateModalOpen(false);
            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '' });
            toast.success('¡Creado!', 'La plantilla se ha creado correctamente.');
            setSelectedTemplate(data as any);
        } catch (error) {
            toast.error('Error', 'No se pudo crear la plantilla.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleCreateFolder() {
        if (!newItem.slug) return toast.error('Error', 'El nombre es obligatorio.');
        try {
            setIsCreating(true);
            const data = await configService.createEmailTemplate({
                name: newItem.name,
                slug: newItem.slug,
                description: newItem.description,
                subject: 'Carpeta',
                html_content: '',
                variables: [],
                is_folder: true,
                parent_id: navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null
            }) as any;
            setTemplates([...templates, data]);
            setIsFolderModalOpen(false);
            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '' });
            toast.success('¡Creado!', 'La carpeta se ha creado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo crear la carpeta.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleClone(item: EmailItem) {
        try {
            const data = await configService.createEmailTemplate({
                slug: `${item.slug}_copy`,
                description: `Copia de ${item.description}`,
                subject: item.subject,
                html_content: item.html_content,
                variables: item.variables,
                is_folder: false,
                parent_id: item.parent_id
            }) as any;
            setTemplates([...templates, data]);
            toast.success('¡Clonado!', 'La plantilla se ha clonado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo clonar la plantilla.');
        }
    }

    async function handleArchive(item: EmailItem) {
        try {
            const newStatus = item.status === 'activo' ? 'archivado' : 'activo';
            await configService.updateEmailTemplate(item.id, { status: newStatus });
            setTemplates(templates.map(t => t.id === item.id ? { ...t, status: newStatus } : t));
            toast.success(newStatus === 'archivado' ? 'Archivado' : 'Activado', `Plantilla ${newStatus === 'archivado' ? 'archivada' : 'activada'} correctamente.`);
        } catch (error) {
            toast.error('Error', 'No se pudo actualizar el estado.');
        }
    }

    async function handleDelete(item: EmailItem) {
        setItemToManage(item);
        setIsConfirmDeleteOpen(true);
        setActiveMenuId(null);
    }

    async function confirmDelete() {
        if (!itemToManage) return;
        try {
            setIsCreating(true);
            await configService.deleteEmailTemplate(itemToManage.id);
            setTemplates(templates.filter(t => t.id !== itemToManage.id));
            toast.success('Borrado', `${itemToManage.is_folder ? 'Carpeta' : 'Plantilla'} eliminada correctamente.`);
            setIsConfirmDeleteOpen(false);
            setItemToManage(null);
        } catch (error) {
            toast.error('Error', 'No se pudo borrar el elemento.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleRenameSubmit() {
        if (!itemToManage || !newItem.slug) return;
        try {
            setIsCreating(true);
            await configService.updateEmailTemplate(itemToManage.id, {
                name: newItem.name,
                slug: newItem.slug,
                description: newItem.description,
                trigger_event: newItem.trigger_event
            });
            setTemplates(templates.map(t => t.id === itemToManage.id ? {
                ...t,
                name: newItem.name,
                slug: newItem.slug,
                description: newItem.description,
                trigger_event: newItem.trigger_event
            } : t));
            setIsRenameModalOpen(false);
            setItemToManage(null);
            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '' });
            toast.success('¡Actualizado!', 'Se ha actualizado la información correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo actualizar.');
        } finally {
            setIsCreating(false);
        }
    }

    async function handleMoveSubmit(targetParentId: string | null) {
        if (!itemToManage) return;
        try {
            setIsCreating(true);
            await configService.updateEmailTemplate(itemToManage.id, { parent_id: targetParentId });
            setTemplates(templates.map(t => t.id === itemToManage.id ? { ...t, parent_id: targetParentId } : t));
            setIsMoveModalOpen(false);
            setItemToManage(null);
            toast.success('Movido', 'Elemento movido correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo mover el elemento.');
        } finally {
            setIsCreating(false);
        }
    }

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        if (activeMenuId) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [activeMenuId]);

    const ActionMenu = ({ item }: { item: EmailItem }) => (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === item.id ? null : item.id);
                }}
                style={{
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
            >
                <MoreVertical size={20} />
            </button>

            {activeMenuId === item.id && (
                <div
                    className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-xl z-[100] animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
                        padding: '8px'
                    }}
                >
                    {item.is_folder ? (
                        <>
                            <button
                                onClick={() => {
                                    setItemToManage(item);
                                    setNewItem({ name: item.name || '', slug: item.slug, description: item.description || '', subject: '', trigger_event: '' });
                                    setIsRenameModalOpen(true);
                                    setActiveMenuId(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Edit3 size={18} /> Renombrar carpeta
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 8px' }} />
                            <button
                                onClick={() => {
                                    handleDelete(item);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Trash2 size={18} /> Borrar Carpeta
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setItemToManage(item);
                                    setNewItem({ name: item.name || '', slug: item.slug, description: item.description || '', subject: item.subject, trigger_event: item.trigger_event || '' });
                                    setIsRenameModalOpen(true);
                                    setActiveMenuId(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Edit3 size={18} /> Editar Información
                            </button>
                            <button
                                onClick={() => {
                                    handleClone(item);
                                    setActiveMenuId(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Copy size={18} /> Clonar Plantilla
                            </button>
                            <button
                                onClick={() => {
                                    setItemToManage(item);
                                    setIsMoveModalOpen(true);
                                    setActiveMenuId(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <FolderInput size={18} /> Mover a Carpeta
                            </button>
                            <button
                                onClick={() => {
                                    handleArchive(item);
                                    setActiveMenuId(null);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-primary)] rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Archive size={18} /> {item.status === 'activo' ? 'Archivar Plantilla' : 'Reactivar Plantilla'}
                            </button>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 8px' }} />
                            <button
                                onClick={() => {
                                    handleDelete(item);
                                }}
                                className="flex items-center w-full text-sm font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-xl transition-colors text-left border-none cursor-pointer"
                                style={{ padding: '14px 24px', gap: '16px' }}
                            >
                                <Trash2 size={18} /> Eliminar Permanente
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    // Renderizador de previsualización simple
    const renderPreview = (content: string) => {
        let rendered = content;
        selectedTemplate?.variables.forEach(v => {
            const mockValue = v === 'codigo' ? '123456' : v === 'link' ? '#' : `[${v}]`;
            rendered = rendered.replace(new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, 'g'), mockValue);
        });
        return rendered;
    };

    if (isLoading) return <div className="flex justify-center p-24"><Spinner size="lg" /></div>;

    const currentFolderId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null;

    // Filtrar items
    const filteredItems = templates.filter(item => {
        const itemStatus = item.status || 'activo';
        const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
        const matchesSearch =
            item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPath = (item.parent_id || null) === currentFolderId;

        if (viewMode === 'recent') return matchesStatus && matchesSearch;
        return matchesStatus && matchesSearch && matchesPath;
    }).sort((a, b) => {
        if (viewMode === 'recent') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        if (a.is_folder && !b.is_folder) return -1;
        if (!a.is_folder && b.is_folder) return 1;
        return (a.name || a.slug).localeCompare(b.name || b.slug);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Plantillas de correo electrónico
                    </h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Cree y gestione plantillas para todos sus correos electrónicos transaccionales.
                    </p>
                </div>
            </div>

            {!selectedTemplate ? (
                <React.Fragment>
                    {/* Toolbar más espaciosa */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '24px',
                        flexWrap: 'wrap',
                        marginBottom: '8px'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', flex: 1, maxWidth: '700px' }}>
                            <div style={{ position: 'relative', flex: 2 }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, asunto o descripción..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '14px 14px 14px 48px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '14px',
                                        fontSize: '14px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                />
                            </div>

                            <select
                                style={{
                                    padding: '0 16px',
                                    height: '52px',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '14px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    flex: 1,
                                    minWidth: '160px',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="activo">Activos</option>
                                <option value="archivado">Archivados</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="w-full sm:w-auto">
                            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
                                <button
                                    onClick={() => setViewMode('recent')}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        backgroundColor: viewMode === 'recent' ? 'var(--bg-primary)' : 'transparent',
                                        color: viewMode === 'recent' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        boxShadow: viewMode === 'recent' ? 'var(--shadow-sm)' : 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Clock size={16} /> RECIENTES
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        backgroundColor: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent',
                                        color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ListIcon size={16} /> LISTADO
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsFolderModalOpen(true)}
                                    leftIcon={<Folder size={18} />}
                                    style={{ height: '52px', borderRadius: '14px', padding: '0 24px' }}
                                >
                                    Carpeta
                                </Button>
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    leftIcon={<Plus size={18} />}
                                    style={{ height: '52px', borderRadius: '14px', padding: '0 24px' }}
                                >
                                    Nuevo
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Breadcrumbs con aire */}
                    {navigationPath.length > 0 && (
                        <div className="flex items-center gap-3 px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="hover:text-[var(--color-primary)] cursor-pointer transition-colors" onClick={() => setNavigationPath([])}>DIRECTORIO RAÍZ</span>
                            {navigationPath.map((id, index) => {
                                const folder = templates.find(t => t.id === id);
                                return (
                                    <React.Fragment key={id}>
                                        <ChevronRight size={12} className="opacity-40" />
                                        <span
                                            className="hover:text-[var(--color-primary)] cursor-pointer transition-colors text-[var(--text-secondary)]"
                                            onClick={() => setNavigationPath(navigationPath.slice(0, index + 1))}
                                        >
                                            {folder?.name || folder?.slug || 'CARPETA'}
                                        </span>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* Tabla de Plantillas - Elevada y Espaciosa */}
                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <Card noPadding style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '18px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            backgroundColor: 'var(--card-bg)',
                            overflow: 'visible' // Permitir desbordamiento del menú
                        }}>
                            <div style={{ borderRadius: '18px', minHeight: '450px', overflow: 'visible' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                                        <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-color)' }}>
                                            <th style={{ padding: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', borderTopLeftRadius: '18px' }}>Identificación</th>
                                            <th style={{ padding: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tipo / Disparador</th>
                                            <th style={{ padding: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Estado</th>
                                            <th style={{ padding: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Última Actividad</th>
                                            <th style={{ padding: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Responsable</th>
                                            <th style={{ padding: '24px', width: '80px', borderTopRightRadius: '18px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                                        {filteredItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '100px 24px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', opacity: 0.4 }}>
                                                        <Mail size={56} strokeWidth={1.5} color="var(--text-tertiary)" />
                                                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sin elementos en esta ubicación</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => item.is_folder ? setNavigationPath([...navigationPath, item.id]) : setSelectedTemplate(item)}
                                                    style={{
                                                        borderBottom: '1px solid var(--border-color)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.25s ease'
                                                    }}
                                                    className="group hover:bg-[var(--bg-tertiary)]"
                                                >
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                                            <div style={{
                                                                width: '46px',
                                                                height: '46px',
                                                                borderRadius: '12px',
                                                                background: item.is_folder ? 'linear-gradient(135deg, #FFB800, #FF8A00)' : 'linear-gradient(135deg, #0066FF, #0047BB)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                                transition: 'transform 0.2s ease'
                                                            }} className="group-hover:scale-110">
                                                                {item.is_folder ? <Folder size={22} fill="white" /> : <FileEdit size={22} />}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                                    {item.name || item.slug}
                                                                </span>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {item.description || (item.is_folder ? 'Carpeta organizada' : 'Sin descripción adicional')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                                                {item.is_folder ? (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF8A00' }}>
                                                                        <Folder size={14} /> Directorio
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                                                                        <Zap size={14} /> Transaccional
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!item.is_folder && item.trigger_event && (
                                                                <div style={{
                                                                    fontSize: '10px',
                                                                    fontWeight: 900,
                                                                    color: 'var(--color-primary)',
                                                                    backgroundColor: 'var(--color-primary-light)',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    alignSelf: 'flex-start',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    Event: {item.trigger_event}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '24px', textAlign: 'center' }}>
                                                        <Badge variant={(item.status || 'activo') === 'activo' ? 'modern-success' : 'pill-secondary'}>
                                                            {(item.status || 'activo') === 'activo' ? 'ACTIVA' : 'ARCHIVADA'}
                                                        </Badge>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                                {new Date(item.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                            </span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                                {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '24px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '10px',
                                                                backgroundColor: 'var(--color-primary-light)',
                                                                border: '1.5px solid var(--color-primary)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '11px',
                                                                fontWeight: 900,
                                                                color: 'var(--color-primary)',
                                                                boxShadow: '0 2px 4px rgba(0,102,255,0.1)'
                                                            }}>
                                                                {(item.updated_by_name || 'S').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                    {item.updated_by_name || 'SISTEMA'}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Editor Admin</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '24px', textAlign: 'right' }}>
                                                        <ActionMenu item={item} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    <Modal
                        isOpen={isRenameModalOpen}
                        onClose={() => setIsRenameModalOpen(false)}
                        title={itemToManage?.is_folder ? "Editar Carpeta" : "Editar Información"}
                    >
                        <div className="flex flex-col gap-6">
                            {itemToManage?.is_folder ? (
                                <>
                                    <Input
                                        label="Nombre de la Carpeta"
                                        value={newItem.slug}
                                        onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                                        placeholder="Ej: Marketing, Sistema..."
                                    />
                                    <Input
                                        label="Descripción (Opcional)"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="¿Para qué sirve esta carpeta?"
                                    />
                                </>
                            ) : (
                                <>
                                    <Input
                                        label="Nombre Visual"
                                        value={newItem.name}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewItem({ ...newItem, name: val, slug: generateSlug(val) });
                                        }}
                                        placeholder="Ej: Bienvenida"
                                    />

                                    <div className="space-y-1.5">
                                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Disparador (Trigger)</label>
                                        <select
                                            value={newItem.trigger_event}
                                            onChange={(e) => setNewItem({ ...newItem, trigger_event: e.target.value })}
                                            className="w-full h-11 px-4 rounded-[10px] bg-[var(--bg-primary)] border-[1.5px] border-[var(--border-color)] text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all appearance-none cursor-pointer"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'right 16px center',
                                                backgroundSize: '16px',
                                                paddingLeft: '16px'
                                            }}
                                        >
                                            <option value="">Sin Disparador Automático</option>
                                            <option value="user_registration">Registro de Usuario</option>
                                            <option value="password_reset">Recuperación de Contraseña</option>
                                            <option value="order_created">Pedido Creado</option>
                                            <option value="order_shipped">Pedido Enviado</option>
                                            <option value="subscription_active">Suscripción Activada</option>
                                            <option value="payment_failed">Pago Fallido</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Slug (ID del Sistema)</label>
                                        <div className="bg-[var(--bg-secondary)] border-[1.5px] border-[var(--border-color)] border-dashed" style={{ padding: '12px 16px', borderRadius: '10px' }}>
                                            <code className="text-[11px] text-[var(--color-primary)] font-bold tracking-widest uppercase">{newItem.slug || '...'}</code>
                                        </div>
                                    </div>

                                    <Input
                                        label="Descripción"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Para qué sirve esta plantilla..."
                                    />
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="secondary" onClick={() => setIsRenameModalOpen(false)}>Cancelar</Button>
                                <Button onClick={handleRenameSubmit} isLoading={isCreating}>Guardar Cambios</Button>
                            </div>
                        </div>
                    </Modal>

                    <Modal
                        isOpen={isMoveModalOpen}
                        onClose={() => setIsMoveModalOpen(false)}
                        title="Mover a Carpeta"
                    >
                        <div className="flex flex-col gap-5">
                            <p className="text-sm text-[var(--text-secondary)] mb-2">Selecciona la carpeta de destino para <b>{itemToManage?.slug}</b></p>
                            <div className="max-h-60 overflow-y-auto border border-[var(--border-color)] rounded-xl divide-y divide-[var(--border-color)]">
                                <button
                                    onClick={() => handleMoveSubmit(null)}
                                    className="flex items-center gap-3 w-full p-4 text-sm hover:bg-[var(--bg-secondary)] transition-colors text-left"
                                >
                                    <MoveUp size={16} className="text-[var(--text-tertiary)]" /> Raíz (Inicio)
                                </button>
                                {templates.filter(t => t.is_folder && t.id !== itemToManage?.id).map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => handleMoveSubmit(folder.id)}
                                        className="flex items-center gap-3 w-full p-4 text-sm hover:bg-[var(--bg-secondary)] transition-colors text-left"
                                    >
                                        <Folder size={16} className="text-amber-500" /> {folder.slug}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button variant="secondary" onClick={() => setIsMoveModalOpen(false)}>Cancelar</Button>
                            </div>
                        </div>
                    </Modal>
                </React.Fragment>
            ) : (
                /* Editor y Vista Previa en Vivo */
                <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg">
                                <Mail size={18} />
                            </div>
                            <span className="text-lg font-bold">Editando Plantilla: {selectedTemplate.slug.toUpperCase()}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setSelectedTemplate(null)} style={{ borderRadius: '10px' }}>Cancelar</Button>
                            <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save size={16} />} style={{ borderRadius: '10px' }}>Guardar Cambios</Button>
                        </div>
                    </div>

                    {/* Sección Superior: Editor de Código e Info Lateral */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                        {/* Editor Principal */}
                        <div className="xl:col-span-8">
                            <Card title="Editor de Plantilla">
                                <div className="flex flex-col gap-8">
                                    <div className="relative">
                                        <Input
                                            id="subject-input"
                                            label="Asunto del Correo"
                                            value={selectedTemplate.subject}
                                            onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                                            placeholder="Ej: Bienvenido a la plataforma"
                                            leftIcon={<Type size={16} />}
                                            rightElement={
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowVariablesSubject(!showVariablesSubject)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '10px 20px',
                                                            borderRadius: '10px',
                                                            transition: 'all 200ms ease',
                                                            backgroundColor: showVariablesSubject ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                                            color: showVariablesSubject ? 'white' : 'var(--text-tertiary)',
                                                            border: `1px solid ${showVariablesSubject ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!showVariablesSubject) e.currentTarget.style.color = 'var(--color-primary)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!showVariablesSubject) e.currentTarget.style.color = 'var(--text-tertiary)';
                                                        }}
                                                        title="Insertar variable"
                                                    >
                                                        <Tag size={14} />
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Variables</span>
                                                        <ChevronDown size={12} style={{ transform: showVariablesSubject ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                                                    </button>
                                                    {showVariablesSubject && (
                                                        <VariableList onSelect={(v) => insertVariable('subject', v)} />
                                                    )}
                                                </div>
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 relative">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                <Layout size={16} className="text-[var(--color-primary)]" /> Cuerpo del Mensaje (HTML)
                                            </label>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowVariablesBody(!showVariablesBody)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px 20px',
                                                        borderRadius: '10px',
                                                        transition: 'all 200ms ease',
                                                        backgroundColor: showVariablesBody ? 'var(--color-primary)' : 'var(--bg-primary)',
                                                        color: showVariablesBody ? 'white' : 'var(--text-tertiary)',
                                                        border: `1px solid ${showVariablesBody ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!showVariablesBody) e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                        if (!showVariablesBody) e.currentTarget.style.color = 'var(--color-primary)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!showVariablesBody) e.currentTarget.style.borderColor = 'var(--border-color)';
                                                        if (!showVariablesBody) e.currentTarget.style.color = 'var(--text-tertiary)';
                                                    }}
                                                >
                                                    <Zap size={14} />
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Autocompletar Variable</span>
                                                    <ChevronDown size={12} style={{ transform: showVariablesBody ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
                                                </button>
                                                {showVariablesBody && (
                                                    <div className="absolute right-0 top-full z-[110]">
                                                        <VariableList onSelect={(v) => insertVariable('html_content', v)} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <textarea
                                            id="body-textarea"
                                            value={selectedTemplate.html_content}
                                            onChange={(e) => setSelectedTemplate({ ...selectedTemplate, html_content: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '24px',
                                                borderRadius: '16px',
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                color: '#34d399',
                                                fontFamily: 'monospace',
                                                fontSize: '13px',
                                                lineHeight: '1.6',
                                                outline: 'none',
                                                minHeight: '400px',
                                                transition: 'all 200ms ease'
                                            }}
                                            className="shadow-inner focus:ring-2 focus:ring-[var(--color-primary)] scrollbar-custom"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Info y Variables Side */}
                        <div className="xl:col-span-4 flex flex-col gap-6">
                            <Card title="Guía del Desarrollador">
                                <div className="flex flex-col gap-8 p-2">
                                    <div className="space-y-3">
                                        <h5 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                            <Info size={14} /> Función del Email
                                        </h5>
                                        <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                                                {selectedTemplate.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                            <Code size={14} /> Variables Soportadas (Obligatorias)
                                        </h5>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedTemplate.variables.map(v => (
                                                <div
                                                    key={v}
                                                    style={{
                                                        padding: '10px 20px',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: '#10B981'
                                                    }}
                                                    className="shadow-sm hover:scale-105 transition-transform cursor-default"
                                                >
                                                    <CheckCircle2 size={13} />
                                                    {"{{"}{v}{"}}"}
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            style={{ padding: '24px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}
                                        >
                                            <p className="text-[12px] text-[var(--text-tertiary)] leading-normal italic">
                                                Estas variables son fundamentales para que este email funcione correctamente. El autocompletador incluye además campos generales de usuario y tienda.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div
                                style={{
                                    padding: '32px',
                                    backgroundColor: 'var(--color-primary-light)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(0, 102, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '20px'
                                }}
                                className="shadow-sm"
                            >
                                <Info size={24} className="shrink-0 text-[var(--color-primary)]" />
                                <p style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.6', margin: 0 }}>
                                    Tip: Usa estilos inline siempre. El diseño de abajo se actualiza mientras escribes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN VISTA PREVIA: Siempre visible y Responsiva */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Eye size={16} className="text-[var(--color-primary)]" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Vista Previa en Vivo</h3>
                            </div>

                            {/* Selector de Dispositivo (Resizer) - Calibración Final */}
                            <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <button
                                    onClick={() => setPreviewDevice('mobile')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        transition: 'all 200ms ease',
                                        backgroundColor: previewDevice === 'mobile' ? 'var(--bg-primary)' : 'transparent',
                                        color: previewDevice === 'mobile' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: previewDevice === 'mobile' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                    title="Vista Móvil (375px)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="18" x="7" y="3" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('tablet')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        transition: 'all 200ms ease',
                                        backgroundColor: previewDevice === 'tablet' ? 'var(--bg-primary)' : 'transparent',
                                        color: previewDevice === 'tablet' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: previewDevice === 'tablet' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                    title="Vista Tablet (768px)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><line x1="12" x2="12" y1="18" y2="18" /></svg>
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('pc')}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        transition: 'all 200ms ease',
                                        backgroundColor: previewDevice === 'pc' ? 'var(--bg-primary)' : 'transparent',
                                        color: previewDevice === 'pc' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: previewDevice === 'pc' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                    title="Vista PC (1000px)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" ry="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Canvas de Previsualización */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                backgroundColor: 'var(--bg-tertiary)',
                                padding: '60px 20px',
                                borderRadius: '24px',
                                border: '1px solid var(--border-color)',
                                minHeight: '500px',
                                overflow: 'hidden',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    maxWidth: deviceWidths[previewDevice],
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                    overflow: 'hidden',
                                    height: 'fit-content',
                                    transition: 'max-width 400ms cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {/* Browser Mock Header */}
                                <div style={{ backgroundColor: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                                    </div>
                                    <div style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '4px 12px', display: 'flex', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            Vista Previa: {selectedTemplate.subject}
                                        </span>
                                    </div>
                                </div>

                                {/* Email Body */}
                                <div
                                    className="preview-iframe-mock"
                                    style={{
                                        padding: previewDevice === 'mobile' ? '20px' : '40px',
                                        backgroundColor: '#ffffff',
                                        overflowX: 'hidden'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: renderPreview(selectedTemplate.html_content) }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Modales de Creación */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Crear Nueva Plantilla"
                size="sm"
            >
                <div className="flex flex-col gap-6">
                    <div className="space-y-4">
                        <Input
                            label="Nombre Visual"
                            placeholder="Ej: Bienvenida Cliente Nuevo"
                            value={newItem.name}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNewItem({ ...newItem, name: val, slug: generateSlug(val) });
                            }}
                        />
                        <div className="space-y-1.5">
                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Slug Automático (ID del Sistema)</label>
                            <div className="bg-[var(--bg-secondary)] border-[1.5px] border-[var(--border-color)] border-dashed" style={{ padding: '12px 16px', borderRadius: '10px' }}>
                                <code className="text-[11px] text-[var(--color-primary)] font-bold tracking-widest uppercase">{newItem.slug || 'ESPERANDO NOMBRE...'}</code>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Disparador (Trigger)</label>
                            <select
                                value={newItem.trigger_event}
                                onChange={(e) => setNewItem({ ...newItem, trigger_event: e.target.value })}
                                className="w-full h-11 px-4 rounded-[10px] bg-[var(--bg-primary)] border-[1.5px] border-[var(--border-color)] text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 16px center',
                                    backgroundSize: '16px',
                                    paddingLeft: '16px'
                                }}
                            >
                                <option value="">Sin Disparador Automático</option>
                                <option value="user_registration">Registro de Usuario</option>
                                <option value="password_reset">Recuperación de Contraseña</option>
                                <option value="order_created">Pedido Creado</option>
                                <option value="order_shipped">Pedido Enviado</option>
                                <option value="subscription_active">Suscripción Activada</option>
                                <option value="payment_failed">Pago Fallido</option>
                            </select>
                            <p className="text-[10px] text-[var(--text-tertiary)] italic">El disparador automatiza el envío cuando sucede el evento.</p>
                        </div>


                        <Input
                            label="Descripción"
                            placeholder="¿Para qué sirve esta plantilla?"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => {
                            setIsCreateModalOpen(false);
                            setNewItem({ name: '', slug: '', description: '', subject: '', trigger_event: '' });
                        }}>Cancelar</Button>
                        <Button fullWidth onClick={handleCreateTemplate} isLoading={isCreating}>Crear Plantilla</Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                title="Nueva Carpeta"
                size="sm"
            >
                <div className="flex flex-col gap-5">
                    <Input
                        label="Nombre de la Carpeta"
                        placeholder="ej: Marketing, Sistema..."
                        value={newItem.slug}
                        onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                    />
                    <Input
                        label="Descripción (Opcional)"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setIsFolderModalOpen(false)}>Cancelar</Button>
                        <Button fullWidth onClick={handleCreateFolder} isLoading={isCreating}>Crear Carpeta</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={isConfirmDeleteOpen}
                title={itemToManage?.is_folder ? '¿Eliminar carpeta?' : '¿Eliminar plantilla?'}
                description={itemToManage?.is_folder
                    ? `Esta acción eliminará la carpeta "${itemToManage.slug}" y todo su contenido de forma permanente.`
                    : `¿Estás seguro de que deseas eliminar la plantilla "${itemToManage?.name || itemToManage?.slug}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsConfirmDeleteOpen(false);
                    setItemToManage(null);
                }}
                isLoading={isCreating}
            />
        </div>
    );
}
