'use client';

import { BookOpen, Download, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { useBreadcrumbs } from '@/lib/hooks/useBreadcrumbs';
import { ProjectSelect } from '@/modules/projects/components/ProjectSelect';
import { useUiStore } from '@/store/uiStore';
import { useExportBitacora } from '../hooks/useBitacora';
import { BitacoraView } from './BitacoraView';

/** "Bitácora": one project at a time (Q-68), the project picked in the top bar. */
export function BitacoraPage() {
  useBreadcrumbs([{ label: 'Bitácora' }]);
  const projectId = useUiStore((s) => s.currentProjectId);
  const setProjectId = useUiStore((s) => s.setCurrentProjectId);
  const exportAll = useExportBitacora();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        className="print:hidden"
        title="Bitácora"
        description="Bitácora electrónica de ensayos de concreto hidráulico (FPC01-02), un renglón por espécimen"
      >
        <Button
          variant="outline"
          disabled={exportAll.isPending}
          onClick={() => exportAll.mutate({ fileName: 'Bitacora.xlsx' })}
          title="Un libro de Excel con una pestaña por proyecto"
        >
          {exportAll.isPending ? <Loader2 className="animate-spin" /> : <Download />}
          Exportar todos los proyectos
        </Button>
      </PageHeader>

      <div className="w-full sm:w-96 print:hidden">
        <ProjectSelect value={projectId} onChange={setProjectId} />
      </div>

      {projectId ? (
        <BitacoraView key={projectId} projectId={projectId} />
      ) : (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={BookOpen}
            title="Selecciona un proyecto"
            description="Cada proyecto tiene su propia Bitácora, como las pestañas del Excel del laboratorio."
          />
        </div>
      )}
    </div>
  );
}
