import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, isRequired } from './validation';

describe('validation utilities', () => {
  it('validates email addresses correctly', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('validates password complexity', () => {
    expect(isValidPassword('Password123')).toBe(null); // valid
    expect(isValidPassword('short')).toBe('Password harus minimal 8 karakter');
    expect(isValidPassword('lowercase123')).toBe('Password harus mengandung huruf besar');
    expect(isValidPassword('UPPERCASE123')).toBe('Password harus mengandung huruf kecil');
    expect(isValidPassword('NoNumberPass')).toBe('Password harus mengandung angka');
  });

  it('validates required fields', () => {
    expect(isRequired('test', 'Username')).toBe(null);
    expect(isRequired('   ', 'Username')).toBe('Username wajib diisi');
  });
});
