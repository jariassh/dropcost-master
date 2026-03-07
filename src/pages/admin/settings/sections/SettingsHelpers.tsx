import React, { useState, useRef } from 'react';
import { X, Globe, Upload, Info } from 'lucide-react';
import { Input, Button, useToast, Alert } from '@/components/common';
import { storageService } from '@/services/storageService';

export function ClearButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                color: 'var(--text-tertiary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-error)';
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Limpiar campo"
            type="button"
        >
            <X size={16} />
        </button>
    );
}

export function AssetUploader({
    value,
    onUpload,
    path,
    accept = ".png,.jpg,.jpeg,.svg,.webp,.ico",
}: {
    value: string,
    onUpload: (url: string) => void,
    path: string,
    accept?: string,
}) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Archivo muy grande', 'El tamaño máximo permitido es 2MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const url = await storageService.uploadBrandingFile(file, path);
            onUpload(url);
            toast.success('¡Completado!', 'El archivo se ha subido correctamente.');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Error de subida', 'No se pudo subir el archivo.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '8px',
            width: '100%'
        }}>
            <div style={{ flex: 1 }}>
                <Input
                    value={value || ''}
                    onChange={(e: any) => onUpload(e.target.value)}
                    placeholder="https://..."
                    leftIcon={<Globe size={16} />}
                    rightElement={value ? <ClearButton onClick={() => onUpload('')} /> : null}
                />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    className="hidden"
                />
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploading}
                    leftIcon={<Upload size={14} />}
                    className="w-full"
                    style={{
                        height: '36px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)'
                    }}
                >
                    {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                </Button>
            </div>
        </div>
    );
}

export function UnitInput({
    label,
    value,
    onChange,
    unit = "px",
    helperText
}: {
    label: string,
    value: string,
    onChange: (val: string) => void,
    unit?: string,
    helperText?: string
}) {
    const numberValue = value.replace(unit, '');

    return (
        <Input
            label={label}
            value={numberValue}
            onChange={(e: any) => onChange(`${e.target.value}${unit}`)}
            placeholder="0"
            type="number"
            helperText={helperText}
            rightElement={
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', pointerEvents: 'none' }}>
                    {unit}
                </span>
            }
            style={{ paddingRight: '40px', backgroundColor: 'var(--bg-tertiary)' }}
        />
    );
}
