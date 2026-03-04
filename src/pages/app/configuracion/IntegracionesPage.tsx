import React from 'react';
import { MetaAdsIntegrationCard } from '@/components/configuracion/MetaAdsIntegrationCard';
import { MetaAdAccountsTable } from '@/components/configuracion/MetaAdAccountsTable';

export function IntegracionesPage() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            animation: 'fadeIn 0.3s'
        }}>
            {/* Tarjeta de Conexión (Arriba) */}
            <MetaAdsIntegrationCard />

            {/* Listado de Cuentas (Abajo) */}
            <MetaAdAccountsTable />
        </div>
    );
}
