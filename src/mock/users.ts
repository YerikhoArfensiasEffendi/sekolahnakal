import type { User } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'demo@sekolahnakal.com',
    name: 'Demo User',
    avatarUrl: '/images/logo_v2.png',
    role: 'user',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'admin-1',
    email: 'admin@sekolahnakal.com',
    name: 'Admin',
    avatarUrl: '/images/logo_v2.png',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
];
