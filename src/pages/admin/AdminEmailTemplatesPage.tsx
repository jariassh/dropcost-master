import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useToast, Badge, Modal, Input, Spinner } from '@/components/common';
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
    ChevronRight
} from 'lucide-react';
import { configService } from '@/services/configService';

interface EmailItem {
    id: string;
    slug: string;
    subject: string;
    html_content: string;
    description: string;
    variables: string[];
    updated_at: string;
    is_folder?: boolean;
    parent_id?: string | null;
    status: 'activo' | 'archivado';
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
    const [newItem, setNewItem] = useState({ slug: '', description: '', subject: '' });
    const [isCreating, setIsCreating] = useState(false);

    const toast = useToast();

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

        // Cerrar men├║s
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
            { name: 'telefono', label: 'Tel├®fono de Contacto' },
            { name: 'pais', label: 'Pa├¡s de Residencia' },
            { name: 'wallet_saldo', label: 'Saldo en Wallet' },
            { name: 'codigo_referido_personal', label: 'Su C├│digo de Invitaci├│n' },
            { name: 'fecha_registro', label: 'Fecha de Registro' }
        ],
        'Suscripci├│n': [
            { name: 'plan_nombre', label: 'Nombre del Plan Actual' },
            { name: 'plan_precio', label: 'Precio del Plan' },
            { name: 'plan_expiracion', label: 'Fecha de Expiraci├│n' },
            { name: 'estado_suscripcion', label: 'Estado (Activa/Pendiente)' }
        ],
        'Tienda': [
            { name: 'tienda_nombre', label: 'Nombre de la Tienda' },
            { name: 'tienda_pais', label: 'Pa├¡s de la Tienda' },
            { name: 'tienda_moneda', label: 'Moneda (COP, USD, etc)' }
        ],
        'Financiero': [
            { name: 'producto_nombre', label: 'Nombre del Producto (├Ültimo)' },
            { name: 'producto_sku', label: 'SKU del Producto' },
            { name: 'producto_precio_sugerido', label: 'Precio Sugerido' },
            { name: 'producto_utilidad_neta', label: 'Utilidad Neta Estimada' }
        ],
        'Referidos': [
            { name: 'lider_nombre', label: 'Nombre de su L├¡der' },
            { name: 'total_referidos', label: 'Total de Invitados' },
            { name: 'total_comisiones', label: 'Comisiones Totales' }
        ],
        'Seguridad': [
            { name: 'codigo', label: 'C├│digo de Verificaci├│n (OTP)' }
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
                {/* Buscador Din├ímico */}
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

            toast.success('┬íGuardado!', 'La plantilla se ha actualizado correctamente.');
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
            });
            setTemplates([...templates, data]);
            setIsCreateModalOpen(false);
            setNewItem({ slug: '', description: '', subject: '' });
            toast.success('┬íCreado!', 'La plantilla se ha creado correctamente.');
            setSelectedTemplate(data);
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
                slug: newItem.slug,
                description: newItem.description,
                subject: 'Carpeta',
                html_content: '',
                variables: [],
                is_folder: true,
                parent_id: navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null
            });
            setTemplates([...templates, data]);
            setIsFolderModalOpen(false);
            setNewItem({ slug: '', description: '', subject: '' });
            toast.success('┬íCreado!', 'La carpeta se ha creado correctamente.');
        } catch (error) {
            toast.error('Error', 'No se pudo crear la carpeta.');
        } finally {
            setIsCreating(false);
        }
    }

    // Renderizador de previsualizaci├│n simple
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
        const matchesSearch = item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPath = (item.parent_id || null) === currentFolderId;

        if (viewMode === 'recent') return matchesStatus && matchesSearch;
        return matchesStatus && matchesSearch && matchesPath;
    }).sort((a, b) => {
        if (viewMode === 'recent') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        if (a.is_folder && !b.is_folder) return -1;
        if (!a.is_folder && b.is_folder) return 1;
        return a.slug.localeCompare(b.slug);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Plantillas de correo electr├│nico
                    </h1>
                    <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Cree y gestione plantillas para todos sus correos electr├│nicos transaccionales.
                    </p>
                </div>
            </div>

            {!selectedTemplate ? (
                <React.Fragment>
                    {/* Toolbar alineada con Usuarios */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '650px' }}>
                            <div style={{ position: 'relative', flex: 2 }}>
                                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, asunto..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 42px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>

                            <select
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    flex: 1,
                                    minWidth: '150px'
                                }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="activo">Activos</option>
                                <option value="archivado">Archivados</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }} className="w-full sm:w-auto">
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {filteredItems.length} plantillas
                            </p>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => setViewMode('recent')}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderTopLeftRadius: '8px',
                                        borderBottomLeftRadius: '8px',
                                        backgroundColor: viewMode === 'recent' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                        color: viewMode === 'recent' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Clock size={16} />
                                    <span style={{ fontSize: '11px', fontWeight: 700 }}>RECIENTES</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid var(--border-color)',
                                        borderTopRightRadius: '8px',
                                        borderBottomRightRadius: '8px',
                                        backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                                        color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--text-tertiary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <ListIcon size={16} />
                                    <span style={{ fontSize: '11px', fontWeight: 700 }}>LISTADO</span>
                                </button>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => setIsFolderModalOpen(true)}
                                style={{ borderRadius: '12px', padding: '0 20px', height: '44px' }}
                            >
                                <Folder size={18} style={{ marginRight: '8px' }} /> Carpeta
                            </Button>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{ borderRadius: '12px', padding: '0 20px', height: '44px' }}
                                className="w-full sm:w-auto"
                            >
                                <Plus size={18} style={{ marginRight: '8px' }} /> Nuevo
                            </Button>
                        </div>
                    </div>

                    {/* Tabla alineada con Usuarios */}
                    <Card noPadding style={{ overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                        {navigationPath.length > 0 && (
                            <div className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-tertiary)]/20 text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] border-b border-[var(--border-color)]">
                                <span className="hover:text-[var(--color-primary)] cursor-pointer" onClick={() => setNavigationPath([])}>Volver al Inicio</span>
                                {navigationPath.map((id, index) => {
                                    const folder = templates.find(t => t.id === id);
                                    return (
                                        <React.Fragment key={id}>
                                            <ChevronRight size={10} className="opacity-50" />
                                            <span
                                                className="hover:text-[var(--color-primary)] cursor-pointer"
                                                onClick={() => setNavigationPath(navigationPath.slice(0, index + 1))}
                                            >
                                                {folder?.slug || 'Carpeta'}
                                            </span>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plantilla</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actualizado el</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Autor</th>
                                        <th style={{ padding: '16px 24px' }}></th>
                                    </tr>
                                </thead>
                                <tbody style={{ backgroundColor: 'var(--card-bg)' }}>
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                                <div className="flex flex-col items-center gap-4">
                                                    <Mail size={40} className="text-[var(--border-color)]" />
                                                    <p className="text-sm font-medium">No se encontraron plantillas en esta ubicaci├│n.</p>
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
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                        <div style={{
                                                            width: '42px',
                                                            height: '42px',
                                                            borderRadius: '12px',
                                                            background: item.is_folder ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, var(--color-primary), #6366f1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                                        }}>
                                                            {item.is_folder ? <Folder size={20} fill="white" /> : <FileEdit size={20} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.slug.toUpperCase()}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {item.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                        {item.is_folder ? <Folder size={14} className="text-amber-500" /> : <Zap size={14} className="text-[var(--color-primary)]" />}
                                                        {item.is_folder ? 'Carpeta' : 'Dise├▒o Transaccional'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <Badge variant={(item.status || 'activo') === 'activo' ? 'modern-success' : 'pill-secondary'}>
                                                        {(item.status || 'activo') === 'activo' ? 'ACTIVA' : 'ARCHIVADA'}
                                                    </Badge>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {new Date(item.updated_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    {item.updated_by_name ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '8px',
                                                                backgroundColor: 'var(--bg-secondary)',
                                                                border: '1px solid var(--border-color)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '10px',
                                                                fontWeight: 800,
                                                                color: 'var(--color-primary)'
                                                            }}>
                                                                {item.updated_by_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.updated_by_name}</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>SISTEMA</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <ChevronRight size={18} style={{ color: 'var(--text-tertiary)' }} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
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

                    {/* Secci├│n Superior: Editor de C├│digo e Info Lateral */}
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
                            <Card title="Gu├¡a del Desarrollador">
                                <div className="flex flex-col gap-8 p-2">
                                    <div className="space-y-3">
                                        <h5 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                            <Info size={14} /> Funci├│n del Email
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
                                                Estas variables son fundamentales para que este email funcione correctamente. El autocompletador incluye adem├ís campos generales de usuario y tienda.
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
                                    Tip: Usa estilos inline siempre. El dise├▒o de abajo se actualiza mientras escribes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECCI├ôN VISTA PREVIA: Siempre visible y Responsiva */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Eye size={16} className="text-[var(--color-primary)]" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Vista Previa en Vivo</h3>
                            </div>

                            {/* Selector de Dispositivo (Resizer) - Calibraci├│n Final */}
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
                                    title="Vista M├│vil (375px)"
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

                        {/* Canvas de Previsualizaci├│n */}
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

            {/* Modales de Creaci├│n */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Crear Nueva Plantilla"
                size="sm"
            >
                <div className="space-y-5">
                    <Input
                        label="Nombre ├Ünico (slug)"
                        placeholder="ej: BIENVENIDA_CLIENTE"
                        value={newItem.slug}
                        onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                    />
                    <Input
                        label="Asunto del Correo"
                        placeholder="ej: ┬íBienvenido a nuestra tienda!"
                        value={newItem.subject}
                        onChange={(e) => setNewItem({ ...newItem, subject: e.target.value })}
                    />
                    <Input
                        label="Descripci├│n"
                        placeholder="┬┐Para qu├® sirve esta plantilla?"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
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
                <div className="space-y-5">
                    <Input
                        label="Nombre de la Carpeta"
                        placeholder="ej: Marketing, Sistema..."
                        value={newItem.slug}
                        onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                    />
                    <Input
                        label="Descripci├│n (Opcional)"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" fullWidth onClick={() => setIsFolderModalOpen(false)}>Cancelar</Button>
                        <Button fullWidth onClick={handleCreateFolder} isLoading={isCreating}>Crear Carpeta</Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
