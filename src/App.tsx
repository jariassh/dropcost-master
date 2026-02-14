import { useEffect } from 'react';
import { AppRouter } from '@/router/AppRouter';
import { ToastContainer } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

import { BrowserRouter } from 'react-router-dom';
import { Spinner } from '@/components/common/Spinner';

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Inicializa tema
  useTheme();

  // Inicializa sesión
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter />
      <ToastContainer />
    </BrowserRouter>
  );
}
