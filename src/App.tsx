import { useEffect } from 'react';
import { AppRouter } from '@/router/AppRouter';
import { ToastContainer } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

import { BrowserRouter } from 'react-router-dom';
import { Spinner } from '@/components/common/Spinner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de caché por defecto
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  // Inicializa tema
  useTheme();

  // Inicializa sesión
  useEffect(() => {
    initialize();

    // Sincronizar estado global con Supabase Auth si la sesión caduca, inicia o se recupera
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      const state = useAuthStore.getState();
      if (event === 'SIGNED_OUT') {
        if (state.isAuthenticated) {
          state.logout();
        }
      } else if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        // Forzar actualización silenciosa del usuario cuando Supabase autómaticamente
        // toma una sesión de la URL (ej. Recuperación de contraseña).
        if (!state.isAuthenticated && !state.isLoading) {
          state.refreshUser();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    }
  }, [initialize]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
