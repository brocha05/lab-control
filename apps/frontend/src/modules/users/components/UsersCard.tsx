'use client';

import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { usePermission } from '@/lib/hooks/usePermission';
import { useCurrentUser } from '@/modules/auth/hooks/useAuth';
import { ROLE_LABELS, type UserRole } from '@/types';
import type { StaffUser } from '../api/usersApi';
import { useCreateUser, useResetPassword, useUpdateUser, useUsers } from '../hooks/useUsers';

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];
const MIN_PASSWORD = 10;

/** What each position can do in the system (docs/domain/entities.md#roles). */
const ROLE_HINT: Record<UserRole, string> = {
  QUALITY_MANAGER: 'Todo: emite informes y administra usuarios.',
  QMS_COORDINATOR: 'Captura registros y ensayos, catálogos y prepara informes.',
  LAB_MANAGER: 'Solo consulta.',
  FIELD_CREW_CHIEF: 'Solo consulta.',
};

/** Staff accounts of the lab: only for the Jefe de Control de Calidad (A-81). */
export function UsersCard() {
  const allowed = usePermission('users.manage');
  const me = useCurrentUser();
  const { data, isLoading } = useUsers(allowed);
  const update = useUpdateUser();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<StaffUser | null>(null);
  if (!allowed) return null;

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3.5">
        <div>
          <h2 className="text-[15px] font-semibold">Usuarios</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Personal del laboratorio con acceso al sistema y lo que su puesto puede hacer.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus />
          Nuevo usuario
        </Button>
      </div>
      {isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="h-9 px-4 text-left font-medium">Nombre</th>
                <th className="px-3 text-left font-medium">Correo</th>
                <th className="px-3 text-left font-medium">Puesto</th>
                <th className="px-3 text-left font-medium">Estado</th>
                <th className="px-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => {
                const self = u.id === me.data?.user.id;
                return (
                  <tr key={u.id} className="border-b border-row last:border-0">
                    <td className="h-12 px-4 font-medium">
                      {u.fullName}
                      {self && <span className="ml-2 text-xs text-subtle">(tú)</span>}
                    </td>
                    <td className="px-3 text-muted-foreground">{u.email}</td>
                    <td className="px-3">
                      <NativeSelect
                        className="h-8 w-56"
                        value={u.role}
                        disabled={self || update.isPending}
                        title={ROLE_HINT[u.role]}
                        aria-label={`Puesto de ${u.fullName}`}
                        onChange={(e) =>
                          update.mutate({ id: u.id, role: e.target.value as UserRole })
                        }
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </NativeSelect>
                    </td>
                    <td className="px-3">
                      <Badge tone={u.isActive ? 'done' : 'off'}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4">
                      <span className="flex justify-end gap-1">
                        <Button variant="ghost" size="xs" onClick={() => setResetting(u)}>
                          Cambiar contraseña
                        </Button>
                        {!self && (
                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={update.isPending}
                            onClick={() => update.mutate({ id: u.id, isActive: !u.isActive })}
                          >
                            {u.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onOpenChange={setCreating} title="Nuevo usuario">
        {creating && <CreateUserForm onDone={() => setCreating(false)} />}
      </Modal>
      <Modal
        open={resetting !== null}
        onOpenChange={(o) => !o && setResetting(null)}
        title={`Nueva contraseña para ${resetting?.fullName ?? ''}`}
        description="Se cierran todas sus sesiones; entrégale la contraseña en persona."
      >
        {resetting && <ResetPasswordForm user={resetting} onDone={() => setResetting(null)} />}
      </Modal>
    </section>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const create = useCreateUser();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('QMS_COORDINATOR');
  const [password, setPassword] = useState('');
  const valid =
    email.includes('@') && fullName.trim().length >= 2 && password.length >= MIN_PASSWORD;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) create.mutate({ email, fullName, role, password }, { onSuccess: onDone });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="uName" className="text-[13px] font-medium">
          Nombre completo
        </Label>
        <Input id="uName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="uEmail" className="text-[13px] font-medium">
          Correo
        </Label>
        <Input id="uEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="uRole" className="text-[13px] font-medium">
          Puesto
        </Label>
        <NativeSelect id="uRole" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </NativeSelect>
        <p className="text-xs text-subtle">{ROLE_HINT[role]}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="uPass" className="text-[13px] font-medium">
          Contraseña inicial
        </Label>
        <Input
          id="uPass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-subtle">Al menos {MIN_PASSWORD} caracteres.</p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onDone} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid || create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Crear usuario
        </Button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ user, onDone }: { user: StaffUser; onDone: () => void }) {
  const reset = useResetPassword();
  const [password, setPassword] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (password.length >= MIN_PASSWORD) {
          reset.mutate({ id: user.id, password }, { onSuccess: onDone });
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="rPass" className="text-[13px] font-medium">
          Nueva contraseña
        </Label>
        <Input
          id="rPass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-subtle">Al menos {MIN_PASSWORD} caracteres.</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={reset.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={password.length < MIN_PASSWORD || reset.isPending}>
          {reset.isPending && <Loader2 className="animate-spin" />}
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}
