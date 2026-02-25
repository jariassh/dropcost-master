import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { translateError } from '@/lib/errorTranslations';
import { useToast } from '@/components/common';

export function useSessionEnforcer() {
    const { user, logout } = useAuthStore();
    const isLoggingOut = useRef(false);
    const toast = useToast();

    useEffect(() => {
        if (!user?.id) return;

        // Verificar el token actual al montar (por si ya cambió mientras estaba offline)
        const checkCurrentToken = async () => {
             const localToken = localStorage.getItem('dc_session_token');
             if (!localToken) return; // Si no hay token local, quizás es un login antiguo o error.

             const { data, error } = await supabase
                .from('users')
                .select('session_token')
                .eq('id', user.id)
                .single();

             if (data && data.session_token && data.session_token !== localToken) {
                 handleForceLogout();
             }
        };

        checkCurrentToken();

        // Suscribirse a cambios en tiempo real
        // Nota: Usamos filter en el cliente para asegurar compatibilidad con diferentes configuraciones de replica identity
        const subscription = supabase
            .channel(`session_enforcer_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                },
                (payload: any) => {
                    // Filtrar por ID del usuario actual
                    if (payload.new && payload.new.id === user.id) {
                         const newSessionToken = payload.new.session_token;
                         const localToken = localStorage.getItem('dc_session_token');

                         // Si el token cambió en la BD y es diferente al nuestro -> Bye bye
                         if (newSessionToken && localToken && newSessionToken !== localToken) {
                             // console.log("Session token mismatch detected via Realtime. Logging out.");
                             handleForceLogout();
                         }
                    }
                }
            )
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    // console.log("Realtime subscribed for session enforcement");
                }
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id]);

    const handleForceLogout = () => {
        if (isLoggingOut.current) return;
        isLoggingOut.current = true;
        
        toast.error('Sesión cerrada', 'Se ha iniciado sesión en otro dispositivo. Tu sesión actual ha sido cerrada por seguridad.');
        
        // Dar un pequeño tiempo para que el usuario lea el toast si es necesario, 
        // pero idealmente cerrar rápido para evitar acceso no autorizado.
        setTimeout(() => {
            logout();
            window.location.href = '/login'; // Force reload/redirect
        }, 2000);
    };
}
