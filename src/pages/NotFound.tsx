import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 text-center">
      <h1 className="text-7xl font-bold text-brand">404</h1>
      <p className="mt-4 text-xl text-text-primary">Halaman tidak ditemukan</p>
      <p className="mt-2 text-text-secondary">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link to="/" className="mt-8">
        <Button size="lg">Back to Home</Button>
      </Link>
    </div>
  );
}
