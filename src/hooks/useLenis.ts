import { useEffect } from 'react';
import { initLenis } from '@/lib/lenis';

/**
 * Initialize Lenis smooth scrolling at app level.
 * Call this once in App.tsx or MainLayout.
 * Handles cleanup automatically.
 */
export function useLenis(): void {
  useEffect(() => {
    const cleanup = initLenis();
    return cleanup;
  }, []);
}
