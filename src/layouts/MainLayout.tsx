import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLenis } from '@/hooks/useLenis';

export function MainLayout() {
  useLenis();

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <a href="#main-content" className="visually-hidden">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
