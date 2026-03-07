import React, { useRef } from 'react';
import { CustomCodeManager, CustomCodeManagerHandle } from '@/components/admin/CustomCodeManager';
import { PageHeader, Button } from '@/components/common';
import { Code, Plus } from 'lucide-react';
import { useAdminSettings } from '../AdminSettingsContext';

export function TrackingSectionPage() {
    const { config } = useAdminSettings();
    const codeManagerRef = useRef<CustomCodeManagerHandle>(null);

    if (!config) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px', width: '100%' }}>
            <PageHeader
                title="Código de"
                highlight="Seguimiento"
                description="Inyecta scripts de seguimiento y fragmentos de código personalizados en toda la plataforma."
                icon={Code}
                actions={
                    <Button
                        onClick={() => codeManagerRef.current?.handleCreate()}
                        size="lg"
                        leftIcon={<Plus size={20} />}
                    >
                        Crear Nuevo Fragmento
                    </Button>
                }
            />

            <CustomCodeManager ref={codeManagerRef} />
        </div>
    );
}
