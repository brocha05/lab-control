'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Label } from '@/components/ui/label';
import { ProjectSelect } from '@/modules/projects/components/ProjectSelect';
import { useUiStore } from '@/store/uiStore';
import { NewFieldRecordForm } from './NewFieldRecordForm';

/**
 * "Nuevo registro de campo", opened from the top bar or a project. Starts on the project
 * picked in the top bar; another one can be chosen here.
 */
export function NewFieldRecordDialog() {
  const open = useUiStore((s) => s.newRecordOpen);
  const setOpen = useUiStore((s) => s.setNewRecordOpen);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Nuevo registro de campo"
      description="Se crea como borrador; después se transcribe la hoja FPC01-01."
    >
      {open && <DialogBody onClose={() => setOpen(false)} />}
    </Modal>
  );
}

function DialogBody({ onClose }: { onClose: () => void }) {
  const currentProjectId = useUiStore((s) => s.currentProjectId);
  const setCurrentProjectId = useUiStore((s) => s.setCurrentProjectId);
  const [projectId, setProjectId] = useState(currentProjectId);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="newRecordProject" className="text-[13px] font-medium">
          Proyecto<span className="ml-0.5 text-destructive">*</span>
        </Label>
        <ProjectSelect
          id="newRecordProject"
          value={projectId}
          onChange={(id) => {
            setProjectId(id);
            if (id) setCurrentProjectId(id);
          }}
        />
      </div>
      {projectId ? (
        <NewFieldRecordForm key={projectId} projectId={projectId} onClose={onClose} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Los registros se numeran por proyecto (MCH-001, MCH-002…).
        </p>
      )}
    </div>
  );
}
