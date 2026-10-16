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
import { TEST_STATUS } from '@/lib/status';
import { formatDateShort } from '@/lib/utils/formatters';
import { useCancelSpecimen } from '../hooks/useSpecimenTests';
import { RescheduleForm } from './RescheduleForm';
import { usePermission } from '@/lib/hooks/usePermission';

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
  const canCapture = usePermission('records.capture');
  const [editing, setEditing] = useState<Row | null>(null);
  const [cancelling, setCancelling] = useState<Row | null>(null);

  const rows: Row[] = record.deliveries.flatMap((d) =>
    d.samples.flatMap((s) =>
      s.specimens.map((specimen) => ({ sampleNumber: s.sampleNumber, specimen }))
    )
  );

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="border-b px-4 py-3.5">
        <h2 className="text-[15px] font-semibold">Ensayos programados</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          La fecha de cada ensayo está en Ensayos pendientes; los resultados se capturan en la hoja
          de ensayos.
        </p>
      </header>
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Muestra</TableHead>
            <TableHead className="w-28">Espécimen</TableHead>
            <TableHead className="w-24">Molde</TableHead>
            <TableHead className="w-24">Edad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-28">Ensayado</TableHead>
            <TableHead className="w-36 text-right">Resistencia</TableHead>
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
                <TableCell className="font-mono text-[13px]">{row.sampleNumber ?? '—'}</TableCell>
                <TableCell className="font-mono text-[13px] font-semibold">
                  {specimen.specimenNumber ?? '—'}
                </TableCell>
                <TableCell className="font-mono text-[13px]">{specimen.moldCode ?? '—'}</TableCell>
                <TableCell>
                  {test ? `${test.ageDays} días` : '—'}
                  {test?.keepExactDate && (
                    <Badge tone="outline" plain className="ml-1">
                      exacta
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {specimen.status === 'CANCELLED' ? (
                    <Badge tone="off">Espécimen cancelado</Badge>
                  ) : test ? (
                    <Badge tone={TEST_STATUS[test.status].tone}>
                      {TEST_STATUS[test.status].label}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {test?.testDate ? formatDateShort(test.testDate) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {test?.stressKgCm2 != null ? (
                    <>
                      <span className="font-mono font-semibold">{test.stressKgCm2}</span>{' '}
                      <span className="text-xs text-label">
                        kg/cm² · {test.percentOfDesign?.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {open && canCapture && (
                    <>
                      <Button variant="ghost" size="xs" onClick={() => setEditing(row)}>
                        Cambiar edad
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-st-late-fg hover:bg-st-late"
                        onClick={() => setCancelling(row)}
                      >
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
        description="Úsalo si el espécimen se dañó. Se cancela también su ensayo pendiente."
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
