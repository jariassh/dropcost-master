import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminSettings } from './AdminSettingsContext';
import { Spinner } from '@/components/common';

export function AdminSettingsLayout() {
    const { isLoading, config } = useAdminSettings();

    if (isLoading && !config) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="dc-admin-settings-container" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
            {/* 
                Las TABS han sido eliminadas por requerimiento del usuario. 
                La navegación ahora es gestionada exclusivamente por el sidebar principal (acordeón).
            */}
            <main className="animate-in fade-in duration-500">
                <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><Spinner size="lg" /></div>}>
                    <Outlet />
                </React.Suspense>
            </main>
        </div>
    );
}
