import { Outlet, Link } from 'react-router-dom';
import { env } from '@/config/env';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <img
              src="/images/logo.png"
              alt={env.APP_NAME}
              className="mx-auto h-12 w-auto"
            />
          </Link>
        </div>
        <div className="rounded-xl bg-bg-surface p-6 shadow-xl sm:p-8">
          <Outlet />
        </div>
        <p className="mt-6 text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} {env.APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
