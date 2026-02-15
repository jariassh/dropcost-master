export const PLANS = {
  FREE: {
    id: 'plan_free',
    name: 'Plan Gratis',
    price: 0,
    currency: 'USD',
    period: 'mensual',
    description: 'Para emprendedores que están iniciando en el dropshipping.',
    features: [
      'Gestión de 1 tienda',
      'Simulador de costos básico',
      'Historial de actividad básico (7 días)',
      'Soporte por email'
    ],
    limits: {
      stores: 1,
      products: 50
    },
    mercadoPagoId: null 
  },
  PRO: {
    id: 'plan_pro',
    name: 'Plan Pro',
    price: 29.99,
    currency: 'USD',
    period: 'mensual',
    description: 'Para negocios en crecimiento que necesitan escalar.',
    features: [
      'Gestión de hasta 5 tiendas',
      'Simulador de costos avanzado',
      'Historial de actividad completo (30 días)',
      'Integración con Meta Ads',
      'Soporte prioritario'
    ],
    limits: {
      stores: 5,
      products: 500
    },
    mercadoPagoId: null // To be filled after MP configuration
  },
  ENTERPRISE: {
    id: 'plan_enterprise',
    name: 'Plan Enterprise',
    price: 99.99,
    currency: 'USD',
    period: 'mensual',
    description: 'Soluciones a medida para grandes volúmenes.',
    features: [
      'Tiendas ilimitadas',
      'Simulador con IA predictiva',
      'Historial ilimitado',
      'API Access',
      'Gerente de cuenta dedicado'
    ],
    limits: {
      stores: 9999,
      products: 9999
    },
    mercadoPagoId: null // To be filled after MP configuration
  }
} as const;

export type PlanId = typeof PLANS[keyof typeof PLANS]['id'];
export type PlanType = typeof PLANS[keyof typeof PLANS];

export const getPlanById = (id: string): PlanType | undefined => {
  return Object.values(PLANS).find(plan => plan.id === id);
};
