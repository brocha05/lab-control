import apiClient from '@/lib/api/client';
import type { User, UserRole } from '@/types';

export interface StaffUser extends User {
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
}

// Endpoints: docs/api/endpoints.md (users)
export const usersApi = {
  list: () => apiClient.get<StaffUser[]>('/users'),
  create: (data: CreateUserInput) => apiClient.post<StaffUser>('/users', data),
  update: (id: string, data: Partial<Pick<User, 'fullName' | 'role' | 'isActive'>>) =>
    apiClient.patch<StaffUser>(`/users/${id}`, data),
  resetPassword: (id: string, password: string) =>
    apiClient.post<void>(`/users/${id}/password`, { password }),
};
