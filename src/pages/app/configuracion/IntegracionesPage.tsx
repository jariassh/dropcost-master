import React, { useState } from 'react';
import { MetaAdsIntegrationCard } from '@/components/configuracion/MetaAdsIntegrationCard';
import { MetaAdAccountsTable } from '@/components/configuracion/MetaAdAccountsTable';

export function IntegracionesPage() {
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            animation: 'fadeIn 0.3s'
        }}>
            {/* Tarjeta de Conexión (Arriba) */}
            <MetaAdsIntegrationCard
                onSelectIntegration={setSelectedIntegrationId}
                selectedId={selectedIntegrationId}
            />

            {/* Listado de Cuentas (Abajo) */}
            <MetaAdAccountsTable
                integrationId={selectedIntegrationId}
            />
        </div>
    );
}
