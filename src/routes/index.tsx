/**
 * Routing Konfigurasi Aplikasi Sekolah Nakal
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Code-splitting lazy loading untuk seluruh halaman streaming publik & member.
 */

import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorBoundary } from '@/components/ui/RouteErrorBoundary';

// Lazy-loaded pages biar bundle ringan
const Home = lazy(() => import('@/pages/Home'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const ExclusiveInfo = lazy(() => import('@/pages/ExclusiveInfo'));
const PrivateServer = lazy(() => import('@/pages/PrivateServer'));
const Search = lazy(() => import('@/pages/Search'));
const Genre = lazy(() => import('@/pages/Genre'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Profile = lazy(() => import('@/pages/Profile'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));
const History = lazy(() => import('@/pages/History'));
const Settings = lazy(() => import('@/pages/Settings'));
const Watch = lazy(() => import('@/pages/Watch'));
const AdminUpload = lazy(() => import('@/pages/AdminUpload'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/** Loading spinner untuk lazy page */
function PageLoader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-transparent overflow-hidden">
      <div className="h-full bg-red-600 animate-pulse w-full" />
    </div>
  );
}

/** Helper bungkus Suspense */
function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const routes: RouteObject[] = [
  // Halaman streaming publik dengan header & footer
  {
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Lazy><Home /></Lazy> },
      { path: 'gallery', element: <Lazy><Gallery /></Lazy> },
      { path: 'exclusive-info', element: <Lazy><ExclusiveInfo /></Lazy> },
      { path: 'private-server', element: <Lazy><PrivateServer /></Lazy> },
      { path: 'browse', element: <Navigate to="/gallery" replace /> },
      { path: 'movie/:id', element: <Lazy><Watch /></Lazy> },
      { path: 'search', element: <Lazy><Search /></Lazy> },
      { path: 'genre/:slug', element: <Lazy><Genre /></Lazy> },
      { path: 'admin', element: <Lazy><AdminUpload /></Lazy> },
      { path: 'upload', element: <Lazy><AdminUpload /></Lazy> },
    ],
  },
  // Halaman autentikasi member
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'login', element: <Lazy><Login /></Lazy> },
      { path: 'register', element: <Lazy><Register /></Lazy> },
      { path: 'forgot-password', element: <Lazy><ForgotPassword /></Lazy> },
    ],
  },
  // Halaman privat member (profile, watchlist, history, watch)
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: 'profile', element: <Lazy><Profile /></Lazy> },
          { path: 'watchlist', element: <Lazy><Watchlist /></Lazy> },
          { path: 'history', element: <Lazy><History /></Lazy> },
          { path: 'settings', element: <Lazy><Settings /></Lazy> },
          { path: 'watch/:id', element: <Lazy><Watch /></Lazy> },
        ],
      },
    ],
  },
  // 404 Not Found
  { path: '*', element: <Lazy><NotFound /></Lazy> },
];

export const router = createBrowserRouter(routes);
