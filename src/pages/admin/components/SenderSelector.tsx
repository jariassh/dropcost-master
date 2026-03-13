import React, { useState, useEffect, useRef } from 'react';
import { Mail, Search, Plus, Edit3, CheckCircle2, ChevronDown } from 'lucide-react';
import { Modal, Input, Button, useToast } from '@/components/common';
import { supabase } from '@/lib/supabase';

interface AddSenderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, prefix: string) => void;
    defaultName?: string;
    domain: string;
}

const AddSenderModal = ({ isOpen, onClose, onSave, defaultName, domain }: AddSenderModalProps) => {
    const [name, setName] = useState(defaultName || '');
    const [prefix, setPrefix] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(defaultName || '');
            setPrefix('');
        }
    }, [isOpen, defaultName]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nuevo Remitente"
            size="sm"
        >
            <div className="flex flex-col gap-6">
                <Input
                    label="Nombre Visible"
                    placeholder="Ej: DropCost Soporte"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Dirección de Correo</label>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            borderRadius: '10px',
                            border: '1.5px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            overflow: 'hidden',
                            transition: 'all 200ms ease',
                        }}
                        className="focus-within:border-[var(--color-primary)] focus-within:ring-4 focus-within:ring-[rgba(0,102,255,0.15)]"
                    >
                        <input
                            type="text"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                            placeholder="ej: ventas"
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                padding: '12px 16px',
                                fontSize: '14px',
                                color: 'var(--text-primary)',
                                backgroundColor: 'transparent',
                                minWidth: 0
                            }}
                        />
                        <div style={{
                            padding: '12px 16px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderLeft: '1px solid var(--border-color)',
                            color: 'var(--text-tertiary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            userSelect: 'none',
                            whiteSpace: 'nowrap'
                        }}>
                            @{domain || 'dropcost.com'}
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                        Solo se permiten letras minúsculas, números, puntos y guiones.
                    </p>
                </div>

                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <Button variant="secondary" onClick={onClose} style={{ borderColor: 'var(--border-color)' }}>Cancelar</Button>
                    <Button onClick={() => onSave(name, prefix)} disabled={!name || !prefix}>Guardar Remitente</Button>
                </div>
            </div>
        </Modal>
    );
};

interface SenderSelectorProps {
    currentName?: string;
    currentPrefix?: string;
    domain: string;
    onSelect: (name: string, prefix: string) => void;
    templates: any[];
    globalConfig: any;
    onRefresh?: () => void;
}

export const SenderSelector = ({
    currentName,
    currentPrefix,
    domain,
    onSelect,
    templates,
    globalConfig,
    onRefresh
}: SenderSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditNameModal, setShowEditNameModal] = useState(false);
    const [senderToEdit, setSenderToEdit] = useState<{ name: string; prefix: string; count: number } | null>(null);
    const [newName, setNewName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extraer remitentes únicos de todas las plantillas existentes y contar sus usos
    const uniqueSenders = React.useMemo(() => {
        const senders = new Map();
        templates.forEach((t: any) => {
            if (t.sender_prefix) {
                const key = `${t.sender_prefix}@${domain}`;
                if (!senders.has(key)) {
                    senders.set(key, {
                        name: t.sender_name || globalConfig?.nombre_empresa || 'Remitente',
                        prefix: t.sender_prefix,
                        count: 1
                    });
                } else {
                    const existing = senders.get(key);
                    existing.count += 1;
                }
            }
        });
        return Array.from(senders.values());
    }, [templates, domain, globalConfig]);

    const filteredSenders = uniqueSenders.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.prefix.toLowerCase().includes(search.toLowerCase())
    );

    const handleRenameSender = async () => {
        if (!senderToEdit || !newName.trim()) return;
        setIsRenaming(true);
        try {
            const { error } = await (supabase as any)
                .from('email_templates')
                .update({ sender_name: newName.trim() })
                .eq('sender_prefix', senderToEdit.prefix);

            if (error) throw error;
            toast.success('Actualizado', `Se ha actualizado el nombre del remitente en ${senderToEdit.count} plantillas.`);
            if (onRefresh) onRefresh();
            setShowEditNameModal(false);
        } catch (e) {
            toast.error('Error', 'No se pudo actualizar el nombre del remitente.');
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-auto min-h-[56px] px-4 py-3 rounded-[12px] border-[1.5px] transition-all cursor-pointer group select-none flex items-center justify-between ${isOpen
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-[var(--bg-primary)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--color-primary)]/50'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        }`}>
                        <Mail size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                            {currentName || globalConfig?.nombre_empresa || 'Seleccionar Remitente'}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">
                            {currentPrefix ? `${currentPrefix}@${domain}` : 'Configurar dirección...'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-[var(--text-tertiary)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
            </div>

            {isOpen && (
                <div
                    className="absolute left-0 right-0 top-full mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.2))' }}
                >
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                                type="text"
                                placeholder="Buscar remitente..."
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
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto scrollbar-custom" style={{ minHeight: '140px', maxHeight: '240px' }}>
                        {filteredSenders.map((sender) => (
                            <button
                                key={sender.prefix}
                                onClick={() => {
                                    onSelect(sender.name, sender.prefix);
                                    setIsOpen(false);
                                }}
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
                                    textAlign: 'left',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                                className="group hover:bg-[var(--color-primary-light)] last:border-0"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                    <div style={{ padding: '7px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="group-hover:bg-white transition-colors">
                                        <Mail size={13} className="text-[var(--text-secondary)] group-hover:text-[var(--color-primary)]" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }} className="group-hover:text-[var(--color-primary)]">
                                            {sender.name}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '2px' }}>
                                            {sender.prefix}@{domain}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div style={{
                                        padding: '2px 8px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: 'var(--text-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        minWidth: '24px',
                                        textAlign: 'center'
                                    }}>
                                        {sender.count}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSenderToEdit(sender);
                                            setNewName(sender.name);
                                            setShowEditNameModal(true);
                                        }}
                                        className="p-1.5 hover:bg-white rounded-md text-[var(--text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                    <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-40 text-[var(--color-primary)] transition-opacity" />
                                </div>
                            </button>
                        ))}

                        {filteredSenders.length === 0 && search && (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-tertiary)]" style={{ minHeight: '140px' }}>
                                <Search size={32} className="mb-3 opacity-20" />
                                <span className="text-xs font-medium">No se encontraron resultados</span>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAddModal(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1.5px dashed var(--border-color)',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 200ms ease'
                            }}
                            className="hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                        >
                            <Plus size={14} /> Crear Nuevo Remitente
                        </button>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showEditNameModal}
                onClose={() => setShowEditNameModal(false)}
                title="Editar Remitente"
                size="sm"
            >
                <div className="flex flex-col gap-6">
                    <Input
                        label="Nombre Visible"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej: DropCost Soporte"
                    />
                    <div className="space-y-1.5 opacity-70">
                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Correo Electrónico (Solo Lectura)</label>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1.5px solid var(--border-color)',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            color: 'var(--text-tertiary)',
                            cursor: 'not-allowed',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '48px'
                        }}>
                            {senderToEdit?.prefix}@{domain}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowEditNameModal(false)}>Cancelar</Button>
                        <Button onClick={handleRenameSender} isLoading={isRenaming}>Guardar Cambios</Button>
                    </div>
                </div>
            </Modal>

            <AddSenderModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={(name: string, prefix: string) => {
                    onSelect(name, prefix);
                    setShowAddModal(false);
                }}
                defaultName={globalConfig?.nombre_empresa}
                domain={domain}
            />
        </div>
    );
};
