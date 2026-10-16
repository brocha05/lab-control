'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/utils/apiError';
import type { User } from '@/types';
import { type CreateUserInput, usersApi } from '../api/usersApi';

const KEY = ['users'] as const;

export function useUsers(enabled: boolean) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await usersApi.list()).data,
    enabled,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserInput) => (await usersApi.create(data)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Usuario creado');
    },
    onError: (error) => toastApiError(error, 'No se pudo crear el usuario.'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Pick<User, 'fullName' | 'role' | 'isActive'>> & { id: string }) =>
      (await usersApi.update(id, data)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Usuario actualizado');
    },
    onError: (error) => toastApiError(error, 'No se pudo actualizar el usuario.'),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      usersApi.resetPassword(id, password),
    onSuccess: () => toast.success('Contraseña cambiada; el usuario debe volver a entrar'),
    onError: (error) => toastApiError(error, 'No se pudo cambiar la contraseña.'),
  });
}
