import { useState } from 'react';
import { MetaAdsIntegrationCard } from '@/components/configuracion/MetaAdsIntegrationCard';
import { MetaAdAccountsTable } from '@/components/configuracion/MetaAdAccountsTable';
import { Share2 } from 'lucide-react';
import { PageHeader } from '@/components/common';

export function IntegracionesPage() {
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            animation: 'fadeIn 0.3s'
        }}>
            <PageHeader
                title="Integraciones"
                highlight="Publicitarias"
                description="Conecta tus cuentas de anuncios para sincronizar métricas y automatizar el cálculo de CPA en tiempo real."
                icon={Share2}
            />

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
