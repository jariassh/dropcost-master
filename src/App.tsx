import { useEffect } from 'react';
import { AppRouter } from '@/router/AppRouter';
import { ToastContainer } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // Inicializa tema globalmente (aplica en auth y app pages)
  useTheme();

  // Inicializa sesión de usuario
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}
