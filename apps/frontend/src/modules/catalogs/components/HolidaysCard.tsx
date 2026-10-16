'use client';

import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCalendarDate } from '@/lib/utils/formatters';
import { useCreateHoliday, useHolidays, useRemoveHoliday } from '../hooks/useCatalogs';

/**
 * The lab's non-working days (Q-81). A test date on a Sunday or one of these moves to
 * the next working day (Q-21).
 */
export function HolidaysCard() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { data, isLoading } = useHolidays(year);
  const create = useCreateHoliday();
  const remove = useRemoveHoliday();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');

  const add = () => {
    if (!date || !name.trim()) return;
    create.mutate(
      { date, name: name.trim() },
      {
        onSuccess: () => {
          setDate('');
          setName('');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Días festivos</CardTitle>
          <CardDescription>
            Si un ensayo cae en domingo o en uno de estos días, se programa para el siguiente día
            hábil.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Año anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium">{year}</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Año siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="sm:w-44"
            aria-label="Fecha"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Día de la Independencia"
            maxLength={100}
            aria-label="Nombre del día festivo"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={create.isPending || !date || !name.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar
          </Button>
        </form>

        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">Sin días festivos en {year}.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {data.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-32 shrink-0 text-muted-foreground">
                  {formatCalendarDate(h.date)}
                </span>
                <span className="flex-1">{h.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => remove.mutate(h.id)}
                  disabled={remove.isPending}
                  aria-label={`Eliminar ${h.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
