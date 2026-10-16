'use client';

import { Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Modal } from '@/components/shared/Modal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProjectSelect } from '@/modules/projects/components/ProjectSelect';
import { FieldRecordsTable } from './FieldRecordsTable';
import { NewFieldRecordForm } from './NewFieldRecordForm';

/** Records are numbered per project (Q-55), so the list is always for one project. */
export function FieldRecordsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') ?? '';
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const selectProject = (id: string) => {
    setPage(1);
    router.replace(id ? `${pathname}?projectId=${id}` : pathname);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registros de campo"
        description="Recepción de concreto hidráulico en obra (FPC01-01)"
      >
        <Button onClick={() => setCreating(true)} disabled={!projectId}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo registro
        </Button>
      </PageHeader>

      <div className="max-w-xl">
        <ProjectSelect value={projectId} onChange={selectProject} />
      </div>

      <Card>
        {projectId ? (
          <FieldRecordsTable
            projectId={projectId}
            params={{ page, limit: 20 }}
            onPageChange={setPage}
            onCreate={() => setCreating(true)}
          />
        ) : (
          <EmptyState
            title="Selecciona un proyecto"
            description="Los registros se numeran por obra (MCH-001, MCH-002…)."
          />
        )}
      </Card>

      {projectId && (
        <Modal open={creating} onOpenChange={setCreating} title="Nuevo registro de campo">
          <NewFieldRecordForm projectId={projectId} onCancel={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}
