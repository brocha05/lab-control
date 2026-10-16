'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FieldRecordDetail,
  SpecimenView,
} from '@/modules/field-records/types/fieldRecord.types';
import { useCancelSpecimen } from '../hooks/useSpecimenTests';
import type { SpecimenTestStatus } from '../types/specimenTest.types';
import { RescheduleForm } from './RescheduleForm';

const STATUS_LABELS: Record<SpecimenTestStatus, string> = {
  SCHEDULED: 'Programado',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Ensayado',
  CANCELLED: 'Cancelado',
};

interface Row {
  sampleNumber: number | null;
  specimen: SpecimenView;
}

/**
 * Tests planned when the record was completed (6.4): one per specimen, with its age.
 * A test's age can change until it is tested (Q-22); a damaged specimen is cancelled
 * with its open test (5.4).
 */
export function PlannedTestsSection({ record }: { record: FieldRecordDetail }) {
  const cancelSpecimen = useCancelSpecimen();
  const [editing, setEditing] = useState<Row | null>(null);
  const [cancelling, setCancelling] = useState<Row | null>(null);

  const rows: Row[] = record.deliveries.flatMap((d) =>
    d.samples.flatMap((s) =>
      s.specimens.map((specimen) => ({ sampleNumber: s.sampleNumber, specimen }))
    )
  );

  return (
    <section className="rounded-lg border bg-card">
      <header className="p-5 pb-3">
        <h3 className="text-sm font-semibold">Ensayes programados</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          La fecha de cada ensaye está en Pruebas pendientes, ya recorrida por domingos y festivos.
        </p>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Muestra</TableHead>
            <TableHead className="w-28">Espécimen</TableHead>
            <TableHead className="w-24">Molde</TableHead>
            <TableHead className="w-24">Edad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-56" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const { specimen } = row;
            const test = specimen.test;
            const open = test && (test.status === 'SCHEDULED' || test.status === 'IN_PROGRESS');
            return (
              <TableRow key={specimen.id}>
                <TableCell className="font-mono text-xs">{row.sampleNumber ?? '—'}</TableCell>
                <TableCell className="font-mono text-xs">
                  {specimen.specimenNumber ?? '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">{specimen.moldCode ?? '—'}</TableCell>
                <TableCell>
                  {test ? `${test.ageDays} d` : '—'}
                  {test?.keepExactDate && (
                    <Badge variant="outline" className="ml-1">
                      exacta
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {specimen.status === 'CANCELLED' ? (
                    <Badge variant="outline">Espécimen cancelado</Badge>
                  ) : test ? (
                    <Badge variant={test.status === 'COMPLETED' ? 'success' : 'secondary'}>
                      {STATUS_LABELS[test.status]}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {open && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(row)}>
                        Cambiar edad
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setCancelling(row)}>
                        Cancelar
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Modal
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Reprogramar espécimen ${editing?.specimen.specimenNumber ?? ''}`}
      >
        {editing?.specimen.test && (
          <RescheduleForm
            testId={editing.specimen.test.id}
            ageDays={editing.specimen.test.ageDays}
            keepExactDate={editing.specimen.test.keepExactDate}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(o) => !o && setCancelling(null)}
        title={`Cancelar espécimen ${cancelling?.specimen.specimenNumber ?? ''}`}
        description="Úsalo si el espécimen se dañó. Se cancela también su ensaye pendiente."
        confirmLabel="Cancelar espécimen"
        cancelLabel="Volver"
        variant="destructive"
        isLoading={cancelSpecimen.isPending}
        onConfirm={() =>
          cancelling &&
          cancelSpecimen.mutate(cancelling.specimen.id, { onSuccess: () => setCancelling(null) })
        }
      />
    </section>
  );
}
