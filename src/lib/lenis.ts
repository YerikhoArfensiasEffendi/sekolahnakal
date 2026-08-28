import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let rafId: number | null = null;

/**
 * Initialize Lenis smooth scrolling.
 * Returns cleanup function.
 */
export function initLenis(): () => void {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  // Deteksi Safari / WebKit native: Gunakan native hardware-accelerated smooth scroll
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    // Safari sudah memiliki momentum physics 120Hz native yang sangat halus
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }

  lenisInstance = new Lenis({
    duration: 0.8,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 1.0,
    wheelMultiplier: 0.9,
  });

  function raf(time: number) {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  rafId = requestAnimationFrame(raf);

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lenisInstance?.destroy();
    lenisInstance = null;
  };
}

/**
 * Get the current Lenis instance.
 * Useful for programmatic scroll control (e.g., scroll to top).
 */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Pause/resume Lenis. Call when modals open/close.
 */
export function setLenisPaused(paused: boolean): void {
  if (paused) {
    lenisInstance?.stop();
  } else {
    lenisInstance?.start();
  }
}
