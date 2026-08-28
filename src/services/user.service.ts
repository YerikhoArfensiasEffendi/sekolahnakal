import { api } from './api';
import { env } from '@/config/env';
import { API_ENDPOINTS } from '@/constants/api';
import type { UserProfile } from '@/types/user';
import { mockUsers } from '@/mock/users';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const userService = {
  async getProfile(): Promise<UserProfile> {
    if (env.USE_MOCK) {
      await delay(400);
      return {
        ...mockUsers[0]!,
        watchlistCount: 5,
        historyCount: 12,
      };
    }
    return api.get(API_ENDPOINTS.USER.PROFILE);
  },

  async updateProfile(data: { name?: string; avatarUrl?: string }): Promise<UserProfile> {
    if (env.USE_MOCK) {
      await delay(500);
      return {
        ...mockUsers[0]!,
        ...data,
        watchlistCount: 5,
        historyCount: 12,
      };
    }
    return api.put(API_ENDPOINTS.USER.UPDATE, data);
  },
};
