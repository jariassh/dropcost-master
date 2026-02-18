
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { CodePreview, CompactEmptyState } from '@/components/common';
import { Check, X } from 'lucide-react';

interface AttributeSchema {
    name: string;
    label: string;
    type: 'text' | 'color' | 'number' | 'select' | 'url';
    defaultValue?: string;
    options?: string[]; // For select type
    placeholder?: string;
    unit?: string; // e.g., 'px', '%'
}

interface MJMLComponentConfig {
    name: string; // Internal ID
    label: string; // Display Name
    tagName: string;
    defaultAttributes: Record<string, string>;
    allowedAttributes: AttributeSchema[];
    // If provided, uses this function to generate code. Otherwise constructs from tagName + attributes
    template?: (attributes: Record<string, string>, content?: string) => string;
    defaultContent?: string; // Content inside the tag
}

interface MJMLAttributeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (code: string) => void;
    component: MJMLComponentConfig | null;
}

export const MJMLAttributeModal = ({ isOpen, onClose, onInsert, component }: MJMLAttributeModalProps) => {
    const [attributes, setAttributes] = useState<Record<string, string>>({});
    const [content, setContent] = useState('');
    const [previewCode, setPreviewCode] = useState('');

    useEffect(() => {
        if (isOpen && component) {
            setAttributes({ ...component.defaultAttributes });
            setContent(component.defaultContent || '');
        }
    }, [isOpen, component]);

    useEffect(() => {
        if (!component) return;

        let code = '';
        if (component.template) {
            code = component.template(attributes, content);
        } else {
            const attrString = Object.entries(attributes)
                .filter(([_, value]) => value !== '') // Omit empty attributes
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ');

            const hasContent = !!content || ['mj-text', 'mj-button', 'mj-style', 'mj-title', 'mj-preview'].includes(component.tagName);

            if (hasContent) {
                code = `<${component.tagName} ${attrString}>\n  ${content}\n</${component.tagName}>`;
            } else {
                code = `<${component.tagName} ${attrString} />`;
            }
        }
        setPreviewCode(code);
    }, [attributes, content, component]);

    const handleAttributeChange = (key: string, value: string) => {
        setAttributes(prev => ({ ...prev, [key]: value }));
    };

    if (!component) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Configurar ${component.label}`}
            size="lg"
        >
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Configuration Panel */}
                <div className="flex-1 flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {component.allowedAttributes.map((attr) => (
                            <div key={attr.name} className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                                    {attr.label}
                                </label>
                                {attr.type === 'color' ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={attributes[attr.name] || '#000000'}
                                            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                            className="w-10 h-10 p-0 border-0 rounded-lg cursor-pointer"
                                        />
                                        <Input
                                            value={attributes[attr.name] || ''}
                                            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                            placeholder="#RRGGBB"
                                        />
                                    </div>
                                ) : attr.type === 'select' ? (
                                    <select
                                        value={attributes[attr.name] || ''}
                                        onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                        className="w-full h-10 px-3 rounded-[10px] bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                    >
                                        <option value="">Por defecto</option>
                                        {attr.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input
                                        value={attributes[attr.name] || ''}
                                        onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                        placeholder={attr.placeholder || attr.defaultValue}
                                        type={attr.type === 'number' ? 'number' : 'text'}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Content Editor (if applicable) */}
                    {(['mj-text', 'mj-button', 'mj-title', 'mj-preview', 'mj-style'].includes(component.tagName) || component.defaultContent) && (
                        <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--border-color)]">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                                Contenido / Texto
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full p-3 rounded-[10px] bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm font-mono min-h-[100px] focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                placeholder="Escribe el contenido aquí..."
                            />
                        </div>
                    )}

                    {/* Empty State Message */}
                    {/* Empty State Message */}
                    {component.allowedAttributes.length === 0 &&
                        !(['mj-text', 'mj-button', 'mj-title', 'mj-preview', 'mj-style'].includes(component.tagName) || component.defaultContent) && (
                            <CompactEmptyState
                                icon={<Check size={20} className="text-[var(--text-tertiary)]" />}
                                title="Este componente no requiere configuración"
                                description="Se insertará con la estructura estándar recomendada."
                            />
                        )}
                </div>

                {/* Preview Panel */}
                <div className="lg:w-1/3 flex flex-col gap-4">
                    <CodePreview
                        code={previewCode}
                        onReset={() => setAttributes(component.defaultAttributes)}
                        className="h-full"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--border-color)]" style={{ marginTop: '32px', paddingTop: '24px' }}>
                <Button variant="secondary" onClick={onClose} style={{ padding: '10px 24px' }}>Cancelar</Button>
                <Button onClick={() => onInsert(previewCode)} leftIcon={<Check size={16} />} style={{ padding: '10px 24px' }}>
                    Insertar Componente
                </Button>
            </div>
        </Modal>
    );
};
