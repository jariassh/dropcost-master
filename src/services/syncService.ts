/**
 * syncService.ts - Servicio de sincronización de datos externos (Dropi Excel).
 * Hace UPDATE masivo sobre órdenes existentes usando shopify_order_id como llave de cruce.
 */
import { supabase } from '@/lib/supabase';
import { auditService } from './auditService';

export interface SyncResult {
    total_rows: number;
    matched: number;
    updated: number;
    skipped: number;
    errors: string[];
}

export interface DropisyncRow {
    [key: string]: any;
}

export const syncService = {
    /**
     * Sincroniza filas de un Excel de Dropi con las órdenes existentes.
     * Solo actualiza órdenes que ya existen (match por shopify_order_id + tienda_id).
     * NO crea órdenes nuevas — los datos de Dropi solo enriquecen órdenes existentes.
     */
    async syncDropiOrders(
        tiendaId: string,
        rows: DropisyncRow[],
        mapping: Record<string, string>,
        skipEmpty: boolean
    ): Promise<SyncResult> {
        const result: SyncResult = {
            total_rows: rows.length,
            matched: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };

        // Validar que exista el mapeo obligatorio
        const shopifyOrderIdColumn = mapping['shopify_order_id'];
        if (!shopifyOrderIdColumn) {
            throw new Error('El campo "ID DE ORDEN DE TIENDA" es obligatorio para el cruce.');
        }

        // Campos numéricos que deben parsearse
        const numericFields = ['valor_compra', 'precio_flete', 'costo_devolucion', 'comision_dropi', 'total_proveedor'];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            try {
                // Obtener el shopify_order_id de la fila del Excel
                const rawOrderId = row[shopifyOrderIdColumn];
                if (!rawOrderId) {
                    result.skipped++;
                    continue;
                }

                const shopifyOrderId = String(rawOrderId).trim();

                // Construir el objeto de actualización solo con los campos mapeados
                const updateData: Record<string, any> = {};

                for (const [dbField, excelHeader] of Object.entries(mapping)) {
                    // No incluir shopify_order_id en la actualización (es la llave de cruce)
                    if (dbField === 'shopify_order_id') continue;

                    const cellValue = row[excelHeader];

                    // Si skipEmpty está activo y el valor está vacío, no sobrescribir
                    if (skipEmpty && (cellValue === null || cellValue === undefined || cellValue === '')) {
                        continue;
                    }

                    // Parsear valores numéricos
                    if (numericFields.includes(dbField)) {
                        const parsed = parseFloat(String(cellValue).replace(/[,$\s]/g, ''));
                        updateData[dbField] = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
                    }
                    // Parsear fechas
                    else if (dbField === 'fecha_dropi' || dbField === 'fecha_novedad') {
                        if (cellValue) {
                            const dateVal = new Date(cellValue);
                            updateData[dbField] = isNaN(dateVal.getTime()) ? null : dateVal.toISOString();
                        }
                    }
                    // Campos de texto
                    else {
                        updateData[dbField] = cellValue ? String(cellValue).trim() : null;
                    }
                }

                // Si no hay nada que actualizar, saltar
                if (Object.keys(updateData).length === 0) {
                    result.skipped++;
                    continue;
                }

                // Añadir timestamp de actualización y origen dropi
                updateData.updated_at = new Date().toISOString();

                // UPDATE: Buscar match exacto por shopify_order_id + tienda_id
                let { data, error } = await (supabase as any)
                    .from('orders')
                    .update(updateData)
                    .eq('tienda_id', tiendaId)
                    .eq('shopify_order_id', shopifyOrderId)
                    .select('id')
                    .maybeSingle();

                // FALLBACK: Si no hay match por ID largo, intentar por el número de orden humano
                if (!data && !error) {
                    // Limpiar el orderId para búsqueda secundaria (quitar # si lo tiene)
                    const cleanOrderNumber = shopifyOrderId.startsWith('#') ? shopifyOrderId : `#${shopifyOrderId}`;
                    const altOrderNumber = shopifyOrderId.replace('#', '');

                    const { data: altData, error: altError } = await (supabase as any)
                        .from('orders')
                        .update(updateData)
                        .eq('tienda_id', tiendaId)
                        .or(`order_number.eq.${cleanOrderNumber},order_number.eq.${altOrderNumber}`)
                        .select('id')
                        .maybeSingle();
                    
                    data = altData;
                    error = altError;
                }

                if (error) {
                    result.errors.push(`Fila ${i + 2}: Error de base de datos - ${error.message} (Código: ${error.code})`);
                    continue;
                }

                if (data) {
                    result.matched++;
                    result.updated++;
                } else {
                    // No se encontró match ni por ID ni por Número
                    result.skipped++;
                }
            } catch (err: any) {
                result.errors.push(`Fila ${i + 2}: ${err.message}`);
            }
        }

        // Log de auditoría
        auditService.recordLog({
            accion: 'SYNC_DROPI_ORDERS',
            entidad: 'ORDERS',
            entidadId: tiendaId,
            detalles: {
                total_rows: result.total_rows,
                matched: result.matched,
                updated: result.updated,
                skipped: result.skipped,
                errors_count: result.errors.length
            }
        });

        return result;
    }
};
