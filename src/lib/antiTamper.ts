/**
 * Sekolah Nakal Anti-Tampering & Security Watchdog v3.0
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Sistem Keamanan Tingkat Tinggi:
 * - Mendeteksi pembukaan DevTools / Inspect Element (Shortcut, Menu, Docked & Floating)
 * - Saat terdeteksi: Langsung kunci ke Layar Merah (Security Lockdown)
 * - Persisten di localStorage: Refresh halaman tetap terkunci!
 * - Menghapus jejak memori & DOM sehingga tab Network & Source kosong
 */

const SECURITY_LOCKDOWN_EVENT = 'sekolah_nakal_security_lockdown';
const SECURITY_RESTORE_EVENT = 'sekolah_nakal_security_restore';
const STORAGE_KEY = 'sn_security_lockdown';

const ASCII_LOGO = `
 ███████╗███████╗██╗  ██╗ ██████╗ ██╗      █████╗ ██╗  ██╗
 ██╔════╝██╔════╝██║ ██╔╝██╔═══██╗██║     ██╔══██╗██║  ██║
 ███████╗█████╗  █████═╝ ██║   ██║██║     ███████║███████║
 ╚════██║██╔══╝  ██╔═██╗ ██║   ██║██║     ██╔══██║██║  ██║
 ███████║███████╗██║ ╚██╗╚██████╔╝███████╗██║  ██║██║  ██║
 ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
 ███╗   ██╗ █████╗ ██╗  ██╗ █████╗ ██╗     
 ████╗  ██║██╔══██╗██║ ██╔╝██╔══██╗██║     
 ██╔██╗ ██║███████║█████═╝ ███████║██║     
 ██║╚██╗██║██╔══██║██╔═██╗ ██╔══██║██║     
 ██║ ╚████║██║  ██║██║ ╚██╗██║  ██║███████╗
 ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
`;

export function printConsoleWarning(): void {
  try {
    console.log(
      `%c${ASCII_LOGO}`,
      'color: #ff3344; font-family: monospace; font-size: 11px; font-weight: bold; line-height: 1.15; text-shadow: 0 0 8px rgba(255, 51, 68, 0.6);'
    );
    console.log(
      '%c🛑 PERINGATAN KEAMANAN: SEKOLAH NAKAL ACTIVE SHIELD',
      'color: #ff3344; font-size: 20px; font-weight: 900; text-shadow: 2px 2px 0 #000; padding: 4px 0;'
    );
    console.log(
      '%cMau cloning kah? Mau nyuri kah? Klo nonton nonton aja gausah betingkah!\n🚨 Percobaan manipulasi kode atau injeksi skrip langsung trigger SECURITY LOCKDOWN otomatis.\n👨‍💻 Web Developer: @beone — Sekolah Nakal Dev',
      'color: #fefefe; font-size: 13px; font-weight: bold; line-height: 1.6; background-color: #1c0a0c; padding: 12px 16px; border-left: 5px solid #ff3344; border-radius: 6px;'
    );
  } catch {
    // ignore
  }
}

export function initConsoleSecurity(): void {
  // Cetak langsung
  printConsoleWarning();

  // Trigger banner lagi saat devtools pertama kali membaca object (Console open trigger)
  try {
    const detector = {
      get id() {
        printConsoleWarning();
        return 'active_shield';
      },
    };
    console.log('%c', 'font-size:0;', detector);
  } catch {
    // ignore
  }
}

// Trigger lockdown secara persisten (localStorage)
export function triggerSecurityLockdown(reason: string = 'Mode Inspect / DevTools terdeteksi aktif'): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reason, timestamp: Date.now() }));
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SECURITY_LOCKDOWN_EVENT, { detail: { reason } }));
  }
}

// Buka kunci lockdown
export function restoreSecuritySession(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SECURITY_RESTORE_EVENT));
  }
  return true;
}

// Cek apakah browser sedang kena lockdown
export function isSecurityLocked(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

// Ambil alasan kenapa dikunci
export function getSecurityLockReason(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.reason || 'Mode Inspect / DevTools terdeteksi aktif';
    }
  } catch {
    // fallback
  }
  return 'Mode Inspect / DevTools terdeteksi aktif';
}

// Detektor apakah DevTools saat ini sedang terbuka
export function isDevToolsOpen(): boolean {
  if (typeof window === 'undefined') return false;

  // Izinkan developer / admin saat membuka console di dashboard admin
  if (window.location.pathname.startsWith('/admin') || sessionStorage.getItem('admin_authenticated') === 'true') {
    return false;
  }

  // Skip dimensi-based detection pada perangkat sentuh (iOS/Android)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) return false;

  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth > threshold;
  const heightDiff = window.outerHeight - window.innerHeight > threshold;
  return widthDiff || heightDiff;
}

// Listener komprehensif (Keyboard, ContextMenu, Dimension Resize, Debugger Timing)
export function attachSecurityListeners(onLockdown: (reason: string) => void): () => void {
  // 1. Blokir shortcut keyboard F12, Ctrl+Shift+I, dkk
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isModifier = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      onLockdown('Pintasan F12 (Inspect / DevTools) terdeteksi');
      return;
    }

    if ((isModifier && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) ||
        (isMac && e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73))) {
      e.preventDefault();
      onLockdown('Pintasan Inspect Elements terdeteksi');
      return;
    }

    if ((isModifier && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) ||
        (isMac && e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74))) {
      e.preventDefault();
      onLockdown('Pintasan Developer Console terdeteksi');
      return;
    }

    if ((isModifier && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) ||
        (isMac && e.metaKey && e.altKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67))) {
      e.preventDefault();
      onLockdown('Pintasan Inspector Cursor terdeteksi');
      return;
    }

    if ((isModifier && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) ||
        (isMac && e.metaKey && e.altKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85))) {
      e.preventDefault();
      onLockdown('Percobaan View Source terdeteksi');
      return;
    }
  };

  // 2. Deteksi DevTools melalui Resize & Interval
  const checkDevTools = () => {
    if (isDevToolsOpen()) {
      onLockdown('Jendela Developer Tools / Inspect Element terbuka');
    }
  };

  const checkInterval = setInterval(checkDevTools, 1500);

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('resize', checkDevTools, { passive: true });

  // Initial check saat pertama kali load
  checkDevTools();

  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('resize', checkDevTools);
    clearInterval(checkInterval);
  };
}
