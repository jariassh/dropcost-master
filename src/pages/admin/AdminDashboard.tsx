import React from 'react';
import { Card } from '@/components/common/Card';
import { Users, CreditCard, Ticket, ShieldAlert } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const stats = [
        { label: 'Usuarios Totales', value: '1,250', icon: Users, color: '#3B82F6' },
        { label: 'Suscripciones Activas', value: '850', icon: CreditCard, color: '#10B981' },
        { label: 'Cupones Activos', value: '12', icon: Ticket, color: '#F59E0B' },
        { label: 'Alertas Sistema', value: '0', icon: ShieldAlert, color: '#6B7280' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Resumen global del estado de DropCost Master y herramientas de gestión.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <div className="flex items-center gap-4">
                            <div
                                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                                className="p-3 rounded-xl"
                            >
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Usuarios Recientes">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                        U{i}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Usuario Demo {i}</p>
                                        <p className="text-xs text-gray-500">plan_pro • Hace {i * 10} min</p>
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">Activo</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Estado del Sistema">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">API Gateway</span>
                            <span className="text-sm font-medium text-green-600">Operativo</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Database (PostgreSQL)</span>
                            <span className="text-sm font-medium text-green-600">Operativo</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Integración Meta Ads</span>
                            <span className="text-sm font-medium text-green-600">Sincronizado</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Supabase Edge Functions</span>
                            <span className="text-sm font-medium text-green-600">Operativo</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
