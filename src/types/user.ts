export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile extends User {
  watchlistCount: number;
  historyCount: number;
}
