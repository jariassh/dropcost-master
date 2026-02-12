import './index.css';
import { AppRouter } from '@/router/AppRouter';
import { ToastContainer } from '@/components/common';
import { useTheme } from '@/hooks/useTheme';

export default function App() {
  // Inicializa tema globalmente (aplica en auth y app pages)
  useTheme();

  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}
