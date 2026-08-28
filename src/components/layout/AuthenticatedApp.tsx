/**
 * Kontainer Aplikasi Utama (Streaming Dashboard)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Ini di-lazyload biar aman, cuma jalan klo pintu depan udah kebuka.
 */

import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { WatchlistProvider } from '@/contexts/WatchlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { router } from '@/routes';

export default function AuthenticatedApp() {
  return (
    <NotificationProvider>
      <ToastProvider>
        <WatchlistProvider>
          <RouterProvider router={router} />
        </WatchlistProvider>
      </ToastProvider>
    </NotificationProvider>
  );
}
