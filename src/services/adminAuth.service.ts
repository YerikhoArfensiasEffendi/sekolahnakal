/**
 * Admin Security & PIN Authentication Service (Sekolah Nakal Studio)
 * Dibikin oleh: beone - sekolah nakal web dev
 * 
 * Fitur:
 * - Proteksi akses Creator Studio dengan PIN / Master Password
 * - Auto-lock & validasi sesi di sessionStorage (hilang saat browser ditutup)
 * - Proteksi brute-force (lockout jika salah 5 kali berturut-turut)
 * - Kemampuan mengubah PIN kustom oleh admin
 */

const PIN_STORAGE_KEY = 'sn_admin_master_pin';
const SESSION_AUTH_KEY = 'sn_admin_authenticated_session';
const ATTEMPTS_KEY = 'sn_admin_failed_attempts';
const LOCKOUT_KEY = 'sn_admin_lockout_until';

const DEFAULT_PIN = '8888'; // PIN Default awal

export const adminAuthService = {
  // Ambil PIN yang aktif (atau default jika belum diubah)
  getMasterPin(): string {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  },

  // Cek apakah admin sedang dalam status terautentikasi (sesi aktif)
  isAuthenticated(): boolean {
    try {
      const session = sessionStorage.getItem(SESSION_AUTH_KEY);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed.authenticated === true && parsed.expiresAt > Date.now();
    } catch {
      return false;
    }
  },

  // Cek apakah admin sedang terkena penalti lockout karena salah PIN berkali-kali
  getLockoutRemainingSeconds(): number {
    try {
      const lockoutUntil = Number(localStorage.getItem(LOCKOUT_KEY) || 0);
      if (lockoutUntil > Date.now()) {
        return Math.ceil((lockoutUntil - Date.now()) / 1000);
      }
      return 0;
    } catch {
      return 0;
    }
  },

  // Validasi PIN input
  verifyPin(inputPin: string): { success: boolean; message: string; remainingAttempts?: number } {
    const lockoutSec = this.getLockoutRemainingSeconds();
    if (lockoutSec > 0) {
      return {
        success: false,
        message: `Terlalu banyak percobaan salah. Coba lagi dalam ${lockoutSec} detik.`,
      };
    }

    const currentPin = this.getMasterPin();
    if (inputPin === currentPin) {
      // Reset failed attempts
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);

      // Simpan sesi aktif selama 12 jam
      sessionStorage.setItem(
        SESSION_AUTH_KEY,
        JSON.stringify({
          authenticated: true,
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        })
      );

      return { success: true, message: 'Autentikasi Creator Studio berhasil!' };
    }

    // Hitung kesalahan
    let attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));

    if (attempts >= 5) {
      const lockoutTime = Date.now() + 60 * 1000; // Lockout 60 detik
      localStorage.setItem(LOCKOUT_KEY, String(lockoutTime));
      localStorage.removeItem(ATTEMPTS_KEY);
      return {
        success: false,
        message: 'PIN salah 5 kali berturut-turut. Akses dikunci selama 60 detik!',
      };
    }

    return {
      success: false,
      message: `PIN keamanan salah! Sisa percobaan: ${5 - attempts}`,
      remainingAttempts: 5 - attempts,
    };
  },

  // Ubah Master PIN
  changePin(currentPin: string, newPin: string): { success: boolean; message: string } {
    if (currentPin !== this.getMasterPin()) {
      return { success: false, message: 'PIN lama yang Anda masukkan salah.' };
    }

    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'PIN baru minimal harus 4 karakter/angka.' };
    }

    try {
      localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
      return { success: true, message: 'PIN Studio berhasil diperbarui!' };
    } catch {
      return { success: false, message: 'Gagal menyimpan PIN baru.' };
    }
  },

  // Kunci / Keluar dari sesi Studio
  lockStudio(): void {
    try {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    } catch {
      // ignore
    }
  },
};
