import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { NewFieldRecordDialog } from '@/modules/field-records/components/NewFieldRecordDialog';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1320px] px-[clamp(14px,3vw,32px)] pb-16 pt-[clamp(16px,3vw,32px)]">
            {children}
          </div>
        </main>
      </div>
      <NewFieldRecordDialog />
    </div>
  );
}
