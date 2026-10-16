'use client';

import { Check, Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalog, useCreateCatalogEntry, useRenameCatalogEntry } from '../hooks/useCatalogs';
import type { CatalogKind } from '../types/catalog.types';

interface CatalogCardProps {
  kind: CatalogKind;
  title: string;
  description: string;
  placeholder: string;
}

/** A short list the lab picks from on the field record and can extend (Q-06). */
export function CatalogCard({ kind, title, description, placeholder }: CatalogCardProps) {
  const { data, isLoading } = useCatalog(kind);
  const create = useCreateCatalogEntry(kind);
  const rename = useRenameCatalogEntry(kind);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    create.mutate(name, { onSuccess: () => setNewName('') });
  };

  const saveEdit = () => {
    if (!editing || !editing.name.trim()) return;
    rename.mutate(
      { id: editing.id, name: editing.name.trim() },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={placeholder}
            maxLength={100}
            aria-label={`Agregar a ${title}`}
          />
          <Button type="submit" variant="outline" disabled={create.isPending || !newName.trim()}>
            <Plus />
            Agregar
          </Button>
        </form>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">Todavía no hay registros.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {data.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                {editing?.id === entry.id ? (
                  <>
                    <Input
                      value={editing.name}
                      onChange={(e) => setEditing({ id: entry.id, name: e.target.value })}
                      className="h-8"
                      maxLength={100}
                      autoFocus
                      aria-label="Nuevo nombre"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditing(null);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={saveEdit}
                      disabled={rename.isPending}
                      aria-label="Guardar"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditing(null)}
                      aria-label="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{entry.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditing(entry)}
                      aria-label={`Renombrar ${entry.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
