import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from './Button';

export function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Terjadi Kesalahan';
  let message = 'Halaman tidak dapat dimuat. Silakan coba muat ulang.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = '404 - Halaman Tidak Ditemukan';
      message = 'Halaman yang Anda tuju tidak ditemukan.';
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || message;
    }
  } else if (error instanceof Error) {
    if (error.message.includes('dynamically imported module') || error.message.includes('Failed to fetch')) {
      title = 'Koneksi Terputus / Server Dimuat Ulang';
      message = 'Modul halaman sedang diperbarui atau port server berubah. Silakan klik muat ulang di bawah.';
    } else {
      message = error.message;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary p-6 text-center text-text-primary">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{title}</h1>
      <p className="text-sm sm:text-base text-text-secondary max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={() => window.location.reload()} size="md">
          Muat Ulang Halaman (Reload)
        </Button>
        <Link to="/">
          <Button variant="secondary" size="md">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
