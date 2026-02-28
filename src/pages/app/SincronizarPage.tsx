import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Info, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Table as TableIcon, Check, Settings2, ShieldCheck, Database, AlertTriangle } from 'lucide-react';
import { Button, Badge, Card, Input, Tooltip, Select } from '@/components/common';
import { StepIndicator } from '@/components/common/StepIndicator';
import { syncService, type SyncResult } from '@/services/syncService';
import { useStoreStore } from '@/store/useStoreStore';
import * as XLSX from 'xlsx';

// Campos en nuestra BD vs lo que el usuario mapea
// IMPORTANTE: las keys deben coincidir EXACTAMENTE con los nombres de columna en public.orders
const MAPPABLE_FIELDS = [
    { key: 'shopify_order_id', label: 'ID DE ORDEN DE TIENDA', mandatory: true, tooltip: 'El identificador único de Shopify que permite vincular el registro de Dropi con la venta original.' },
    { key: 'estado_logistica', label: 'ESTATUS', mandatory: true, tooltip: 'El estado actual del paquete (Entregado, Devuelto, En Camino, etc.)' },
    { key: 'guia_transporte', label: 'NÚMERO GUIA', mandatory: false, tooltip: 'El número de rastreo del paquete (Número Guía).' },
    { key: 'transportadora', label: 'TRANSPORTADORA', mandatory: false, tooltip: 'Nombre de la empresa que realiza la entrega.' },
    { key: 'fecha_dropi', label: 'FECHA', mandatory: false, tooltip: 'Fecha principal del registro en Dropi.' },
    { key: 'cliente_nombre', label: 'NOMBRE CLIENTE', mandatory: false, tooltip: 'Nombre completo del destinatario.' },
    { key: 'cliente_telefono', label: 'TELÉFONO', mandatory: false, tooltip: 'Número de contacto del cliente.' },
    { key: 'cliente_email', label: 'EMAIL', mandatory: false, tooltip: 'Correo electrónico del cliente.' },
    { key: 'cliente_direccion', label: 'DIRECCIÓN DESTINO', mandatory: false, tooltip: 'Dirección física corregida del cliente.' },
    { key: 'cliente_departamento', label: 'DEPARTAMENTO DESTINO', mandatory: false, tooltip: 'Departamento donde se entrega el pedido.' },
    { key: 'cliente_ciudad', label: 'CIUDAD DESTINO', mandatory: false, tooltip: 'Ciudad donde se entrega el pedido.' },
    { key: 'valor_compra', label: 'VALOR DE COMPRA EN PRODUCTOS', mandatory: false, tooltip: 'Valor de la compra en productos.' },
    { key: 'precio_flete', label: 'PRECIO FLETE', mandatory: false, tooltip: 'Costo del envío reportado.' },
    { key: 'costo_devolucion', label: 'COSTO DEVOLUCION FLETE', mandatory: false, tooltip: 'Costo incurrido en caso de devolución.' },
    { key: 'comision_dropi', label: 'COMISION', mandatory: false, tooltip: 'Comisión de la plataforma Dropi.' },
    { key: 'total_proveedor', label: 'TOTAL EN PRECIOS DE PROVEEDOR', mandatory: false, tooltip: 'Costo total de los productos a precio de proveedor.' },
    { key: 'fecha_novedad', label: 'FECHA DE NOVEDAD', mandatory: false, tooltip: 'Fecha en la que se reportó la novedad.' },
    { key: 'categorias', label: 'CATEGORÍAS', mandatory: false, tooltip: 'Categorías asociadas al pedido.' },
];


export function SincronizarPage() {
    const [step, setStep] = useState(1);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    // Excel Data
    const [headers, setHeaders] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<any[][]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [skipEmpty, setSkipEmpty] = useState(true);
    const [totalRows, setTotalRows] = useState(0);
    const [allRows, setAllRows] = useState<any[][]>([]);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

    const { tiendaActual } = useStoreStore();
    const inputRef = useRef<HTMLInputElement>(null);

    const steps = ['Subir', 'Asignar', 'Verificar'];

    const handleFile = (file: File) => {
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                if (json.length > 0) {
                    const fileHeaders = json[0].filter(h => h).map(h => String(h).trim());
                    setHeaders(fileHeaders);
                    setPreviewData(json.slice(1, 4)); // Siguientes 3 filas para previsualización
                    setAllRows(json.slice(1)); // Todas las filas de datos
                    setTotalRows(Math.max(0, json.length - 1));

                    const initialMapping: Record<string, string> = {};

                    MAPPABLE_FIELDS.forEach(field => {
                        const targetLabel = field.label.toUpperCase();

                        // 1. Prioridad: Coincidencia exacta (Case Insensitive)
                        const exactMatch = fileHeaders.find(h => h.toUpperCase() === targetLabel);

                        if (exactMatch) {
                            initialMapping[field.key] = exactMatch;
                        }
                        // 2. Fallback inteligente solo para campos base si no hay exacta
                        else if (field.key === 'shopify_order_id') {
                            const fuzzy = fileHeaders.find(h => {
                                const l = h.toLowerCase();
                                return l.includes('orden') || l.includes('order id') || l.includes('tienda');
                            });
                            if (fuzzy) initialMapping[field.key] = fuzzy;
                        }
                        else if (field.key === 'estado_logistica') {
                            const fuzzy = fileHeaders.find(h => h.toLowerCase().includes('estatus') || h.toLowerCase().includes('estado'));
                            if (fuzzy) initialMapping[field.key] = fuzzy;
                        }
                        else if (field.key === 'cliente_direccion') {
                            const fuzzy = fileHeaders.find(h => h.toLowerCase().includes('direccion') || h.toLowerCase().includes('address'));
                            if (fuzzy) initialMapping[field.key] = fuzzy;
                        }
                    });
                    setMapping(initialMapping);
                }
            } catch (err) {
                console.error("Error leyendo excel", err);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleMappingChange = (dbField: string, excelHeader: string) => {
        setMapping(prev => {
            const newMap = { ...prev };
            if (excelHeader === '') {
                delete newMap[dbField];
            } else {
                newMap[dbField] = excelHeader;
            }
            return newMap;
        });
    };

    const canGoToVerify = () => {
        return MAPPABLE_FIELDS.filter(f => f.mandatory).every(f => mapping[f.key]);
    };

    const handleProcessImport = async () => {
        if (!tiendaActual) {
            alert('Error: No hay una tienda seleccionada.');
            return;
        }

        setIsParsing(true);
        setSyncResult(null);

        try {
            // Convertir filas del Excel a objetos usando los headers como keys
            const rowObjects = allRows.map(row => {
                const obj: Record<string, any> = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] !== undefined ? row[index] : null;
                });
                return obj;
            }).filter(obj => {
                // Filtrar filas completamente vacías
                return Object.values(obj).some(v => v !== null && v !== undefined && v !== '');
            });

            const result = await syncService.syncDropiOrders(
                tiendaActual.id,
                rowObjects,
                mapping,
                skipEmpty
            );

            setSyncResult(result);
            setStep(4); // Ir a pantalla de resultados
        } catch (error: any) {
            alert(`Error en la sincronización: ${error.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
            {/* Header del Wizard */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Sincronizador de Pedidos
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Vincula los reportes de Dropi con tus órdenes de Shopify para automatizar el seguimiento.
                </p>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <StepIndicator steps={steps} currentStep={step} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* ─── STEP 1: SUBIR ─── */}
                {step === 1 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
                        <Card style={{ padding: '48px', textAlign: 'center' }}>
                            <div
                                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); }}
                                onClick={() => inputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${dragActive ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                    backgroundColor: dragActive ? 'rgba(0,102,255,0.05)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '20px', padding: '64px 32px', cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
                                }}
                            >
                                <input ref={inputRef} type="file" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0,102,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                    {selectedFile ? <FileSpreadsheet size={40} /> : <UploadCloud size={40} />}
                                </div>
                                {selectedFile ? (
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{selectedFile.name}</h3>
                                        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>{(selectedFile.size / 1024).toFixed(2)} KB • Archivo listo</p>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Carga el reporte de Dropi</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Arrastra tu archivo Excel o haz clic para buscarlo</p>
                                    </div>
                                )}
                            </div>
                            {selectedFile && (
                                <Button
                                    variant="primary"
                                    size="lg"
                                    style={{ marginTop: '32px', width: '240px' }}
                                    onClick={() => setStep(2)}
                                    rightIcon={<ChevronRight size={18} />}
                                >
                                    Siguiente paso
                                </Button>
                            )}
                        </Card>
                        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 700 }}>
                                    <Settings2 size={16} color="var(--color-primary)" />
                                    Instrucciones
                                </h4>
                                <ul style={{ paddingLeft: '18px', margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.8 }}>
                                    <li>Exporta el reporte de "Mis Pedidos" desde Dropi en formato XLSX.</li>
                                    <li>Asegúrate de incluir la columna de ID de orden de Shopify.</li>
                                    <li>No es necesario que las columnas tengan nombres específicos, las mapearemos en el siguiente paso.</li>
                                </ul>
                            </div>
                        </aside>
                    </div>
                )}

                {/* ─── STEP 2: ASIGNAR ─── */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card style={{ padding: '0', overflow: 'visible' }}>
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <TableIcon size={18} color="var(--color-primary)" />
                                    Mapeo de Columnas
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Vincula los encabezados de tu archivo con los campos de DropCost.
                                </p>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead style={{ backgroundColor: 'transparent', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Campo Destino</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Previsualización</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Estado</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Columna en Excel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MAPPABLE_FIELDS.map((f) => {
                                        const mappedHeader = mapping[f.key];
                                        const headerIndex = headers.indexOf(mappedHeader);
                                        const dataPreview = headerIndex !== -1 ? previewData.map(row => row[headerIndex]).filter(v => v !== undefined).slice(0, 3) : [];

                                        return (
                                            <tr key={f.key} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.label}</span>
                                                        {f.mandatory && <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 800 }}>*</span>}
                                                        <Tooltip content={f.tooltip}>
                                                            <Info size={14} style={{ opacity: 0.5, cursor: 'help' }} />
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    {mappedHeader ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {dataPreview.length > 0 ? dataPreview.map((val, i) => (
                                                                <span key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                                    {String(val || '---').substring(0, 30)}
                                                                </span>
                                                            )) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin datos...</span>}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-tertiary)' }}>Selecciona una columna</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    {mappedHeader ? (
                                                        <Badge variant="success">Asignado</Badge>
                                                    ) : (
                                                        <Badge variant={f.mandatory ? "error" : "pill-secondary"}>
                                                            {f.mandatory ? 'Pendiente' : 'Omitido'}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ width: '220px' }}>
                                                        <Select
                                                            options={[
                                                                { value: '', label: '-- Ignorar columna --' },
                                                                ...headers.map(h => ({ value: h, label: h }))
                                                            ]}
                                                            value={mappedHeader || ''}
                                                            onChange={(val) => handleMappingChange(f.key, val)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <Button variant="secondary" onClick={() => setStep(1)} leftIcon={<ChevronLeft size={18} />}>
                                Volver al archivo
                            </Button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={skipEmpty}
                                        onChange={(e) => setSkipEmpty(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    No actualizar valores vacíos
                                    <Tooltip content="Protege tu información: si la celda del Excel está vacía, no se sobrescribirá el valor actual en la base de datos.">
                                        <Info size={14} style={{ opacity: 0.5 }} />
                                    </Tooltip>
                                </label>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    disabled={!canGoToVerify()}
                                    onClick={() => setStep(3)}
                                    rightIcon={<ChevronRight size={18} />}
                                >
                                    Verificar vinculación
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: VERIFICAR ─── */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            <Card style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(0, 102, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                    <Database size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Registros detectados</p>
                                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{totalRows} órdenes</p>
                                </div>
                            </Card>
                            <Card style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                                    <Check size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Campos Vinculados</p>
                                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{Object.keys(mapping).length} campos</p>
                                </div>
                            </Card>
                            <Card style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Protección de datos</p>
                                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{skipEmpty ? 'Activada' : 'Desactivada'}</p>
                                </div>
                            </Card>
                        </div>

                        <Card style={{ padding: '32px', textAlign: 'center', backgroundColor: 'rgba(var(--color-primary-rgb), 0.02)', border: '1.5px dashed var(--color-primary)' }}>
                            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    backgroundColor: 'rgba(0,102,255,0.1)', color: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px'
                                }}>
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Todo listo para sincronizar</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                                    Al hacer clic en el botón de abajo, actualizaremos los estados logísticos en la base de datos haciendo match por el <strong>ID de Shopify</strong>. Esta acción no se puede deshacer.
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <Button variant="secondary" onClick={() => setStep(2)}>Revisar mapeo</Button>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        isLoading={isParsing}
                                        onClick={handleProcessImport}
                                        style={{ padding: '0 48px' }}
                                    >
                                        Iniciar Sincronización
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ─── STEP 4: RESULTADOS ─── */}
                {step === 4 && syncResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            <Card style={{ padding: '24px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Filas Procesadas</p>
                                <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{syncResult.total_rows}</p>
                            </Card>
                            <Card style={{ padding: '24px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Coincidencias</p>
                                <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--color-success)' }}>{syncResult.matched}</p>
                            </Card>
                            <Card style={{ padding: '24px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Actualizadas</p>
                                <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>{syncResult.updated}</p>
                            </Card>
                            <Card style={{ padding: '24px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Sin Match</p>
                                <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--color-warning)' }}>{syncResult.skipped}</p>
                            </Card>
                        </div>

                        {syncResult.errors.length > 0 && (
                            <Card style={{ padding: '24px', border: '1px solid var(--color-warning)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <AlertTriangle size={18} color="var(--color-warning)" />
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Errores ({syncResult.errors.length})</h4>
                                </div>
                                <div style={{ maxHeight: '150px', overflow: 'auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {syncResult.errors.slice(0, 20).map((err, i) => (
                                        <p key={i} style={{ margin: '4px 0' }}>• {err}</p>
                                    ))}
                                    {syncResult.errors.length > 20 && (
                                        <p style={{ margin: '8px 0 0', fontStyle: 'italic' }}>...y {syncResult.errors.length - 20} errores más</p>
                                    )}
                                </div>
                            </Card>
                        )}

                        <Card style={{ padding: '32px', textAlign: 'center' }}>
                            <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Sincronización completada</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
                                Se actualizaron {syncResult.updated} órdenes con los datos de Dropi.
                                {syncResult.skipped > 0 && ` ${syncResult.skipped} filas no encontraron match.`}
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setStep(1);
                                    setSelectedFile(null);
                                    setMapping({});
                                    setSyncResult(null);
                                    setAllRows([]);
                                    setHeaders([]);
                                    setPreviewData([]);
                                    setTotalRows(0);
                                }}
                            >
                                Nueva sincronización
                            </Button>
                        </Card>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                tr:hover { background-color: rgba(0,0,0,0.01); }
            `}</style>
        </div>
    );
}

