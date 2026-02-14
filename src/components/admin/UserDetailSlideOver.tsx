import React from 'react';
import { SlideOver } from '../common/SlideOver';
import { User } from '../../types/user.types';
import { UserStatusBadge } from './UserStatusBadge';

interface UserDetailSlideOverProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
}

export const UserDetailSlideOver: React.FC<UserDetailSlideOverProps> = ({ user, isOpen, onClose }) => {
    if (!user) return null;

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={`Detalles del Usuario (ID: ${user.id})`}
        >
            <div className="space-y-6">
                {/* Encabezado con Avatar y Nombre */}
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                        {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">{user.nombres} {user.apellidos}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="mt-2">
                            <UserStatusBadge status={user.estado_suscripcion} />
                        </div>
                    </div>
                </div>

                {/* Información Personal */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Información Personal</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.telefono || 'No registrado'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">País</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user.pais || 'No registrado'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Fecha Registro</dt>
                            <dd className="mt-1 text-sm text-gray-900">{new Date(user.fecha_registro).toLocaleDateString()}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Última Actividad</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user.ultima_actividad ? new Date(user.ultima_actividad).toLocaleString() : 'N/A'}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Suscripción */}
                <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Suscripción y Plan</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Plan Actual</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-semibold">{user.plan_id ? 'Pro Plan' : 'Gratuito'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Estado</dt>
                            <dd className="mt-1 text-sm text-gray-900 capitalize">{user.estado_suscripcion}</dd>
                        </div>
                    </dl>
                </div>

                {/* Seguridad */}
                <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Seguridad</h4>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Email Verificado</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user.email_verificado ? (
                                    <span className="text-green-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Sí
                                    </span>
                                ) : (
                                    <span className="text-yellow-600">Pendiente</span>
                                )}
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">2FA Habilitado</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user["2fa_habilitado"] ? (
                                    <span className="text-green-600">Activado</span>
                                ) : (
                                    <span className="text-gray-500">Desactivado</span>
                                )}
                            </dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Rol</dt>
                            <dd className="mt-1 text-sm text-gray-900 capitalize">{user.rol}</dd>
                        </div>
                    </dl>
                </div>

                {/* Sistema de Referidos */}
                {(user.codigo_referido_personal || user.wallet_saldo !== undefined) && (
                    <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Sistema de Referidos</h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Código de Referido</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">
                                    {user.codigo_referido_personal || 'N/A'}
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Saldo Billetera</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold text-green-600">
                                    ${(user.wallet_saldo || 0).toLocaleString('es-CO')} COP
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>
        </SlideOver>
    );
};
