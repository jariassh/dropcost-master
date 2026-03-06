/**
 * Servicio para Email Marketing.
 * Implementa la lógica de obtención de listas, campañas y métricas.
 */
import { EmailSegment, EmailCampaign, EmailTemplate } from '@/types/marketing';

/**
 * Obtiene el resumen del dashboard de marketing.
 */
export const getMarketingStats = async () => {
    // Simulación de carga
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                totalCampaigns: 24,
                totalEmailsSent: 15420,
                avgSuccessRate: 98.2,
                activeSegments: 12
            });
        }, 500);
    });
};

/**
 * Obtiene todas las campañas de email.
 */
export const getCampaigns = async (): Promise<EmailCampaign[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: '1',
                    name: 'Oferta Relámpago Marzo',
                    subject: '¡Solo por hoy! 50% de descuento',
                    template_id: 'temp-1',
                    segment_id: 'seg-1',
                    status: 'processing',
                    created_at: new Date().toISOString(),
                    stats: { total: 1200, sent: 850, failed: 12, pending: 338 }
                },
                {
                    id: '2',
                    name: 'Bienvenida Nuevos Usuarios',
                    subject: 'Bienvenido a DropCost Master',
                    template_id: 'temp-2',
                    segment_id: 'seg-2',
                    status: 'completed',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    stats: { total: 450, sent: 448, failed: 2, pending: 0 }
                }
            ]);
        }, 600);
    });
};

/**
 * Obtiene todas las listas/segmentos inteligentes.
 */
export const getSegments = async (): Promise<EmailSegment[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: 'seg-1',
                    name: 'Clientes VIP Colombia',
                    description: 'Usuarios con más de 5 costeos en COP',
                    filters: { operator: 'AND', conditions: [] },
                    count: 1250,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'seg-2',
                    name: 'Abandono de Registro',
                    description: 'Usuarios que iniciaron registro pero no activaron 2FA',
                    filters: { operator: 'AND', conditions: [] },
                    count: 340,
                    created_at: new Date().toISOString()
                }
            ]);
        }, 400);
    });
};

/**
 * Obtiene las plantillas de email disponibles.
 */
export const getTemplates = async (): Promise<EmailTemplate[]> => {
    return [
        { id: 'temp-1', name: 'Layout Venta Directa' },
        { id: 'temp-2', name: 'Bienvenida Minimalista' },
        { id: 'temp-3', name: 'Alerta Recuperación Cuenta' }
    ];
};

/**
 * Crea una nueva campaña.
 */
export const createCampaign = async (campaign: Partial<EmailCampaign>) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Math.random().toString(), ...campaign }), 1000);
    });
};

/**
 * Crea o actualiza un segmento inteligente.
 */
export const saveSegment = async (segment: Partial<EmailSegment>) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Math.random().toString(), ...segment }), 800);
    });
};
