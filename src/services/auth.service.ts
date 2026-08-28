import { api } from './api';
import { env } from '@/config/env';
import { API_ENDPOINTS } from '@/constants/api';
import type { AuthResponse, LoginCredentials, RegisterData } from '@/types/auth';
import type { User } from '@/types/user';
import { mockUsers } from '@/mock/users';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (env.USE_MOCK) {
      await delay(800);
      const user = mockUsers.find((u) => u.email === credentials.email);
      if (!user) {
        throw { message: 'Email atau password salah', status: 401 };
      }
      // Mock: any password works in dev. Real auth uses server-side hashing.
      return { user, token: `mock-token-${user.id}` };
    }
    return api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (env.USE_MOCK) {
      await delay(800);
      const newUser: User = {
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      return { user: newUser, token: `mock-token-${newUser.id}` };
    }
    return api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  async getMe(): Promise<User> {
    if (env.USE_MOCK) {
      await delay(300);
      return mockUsers[0]!;
    }
    return api.get<User>(API_ENDPOINTS.AUTH.ME);
  },

  async logout(): Promise<void> {
    if (env.USE_MOCK) {
      await delay(200);
      return;
    }
    return api.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (env.USE_MOCK) {
      await delay(800);
      // Always return success to prevent email enumeration
      return { message: 'Jika email terdaftar, link reset password telah dikirim.' };
    }
    return api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },
};
