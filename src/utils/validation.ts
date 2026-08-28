/**
 * Simple form validation helpers.
 * These are for UX feedback only — server must re-validate everything.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): string | null {
  if (password.length < 8) return 'Password harus minimal 8 karakter';
  if (!/[A-Z]/.test(password)) return 'Password harus mengandung huruf besar';
  if (!/[a-z]/.test(password)) return 'Password harus mengandung huruf kecil';
  if (!/[0-9]/.test(password)) return 'Password harus mengandung angka';
  return null;
}

export function isRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} wajib diisi`;
  return null;
}
