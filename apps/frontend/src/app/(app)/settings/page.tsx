import type { Metadata } from 'next';
import { SetBreadcrumbs } from '@/components/layout/SetBreadcrumbs';
import { PageHeader } from '@/components/shared/PageHeader';
import { CatalogCard } from '@/modules/catalogs/components/CatalogCard';
import { HolidaysCard } from '@/modules/catalogs/components/HolidaysCard';

export const metadata: Metadata = { title: 'Configuración' };

export default function Page() {
  return (
    <div className="flex flex-col gap-5">
      <SetBreadcrumbs crumbs={[{ label: 'Configuración' }]} />
      <PageHeader
        title="Configuración"
        description="Listas y calendario del laboratorio. Las edades de ensayo se configuran en cada proyecto."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <CatalogCard
          kind="suppliers"
          title="Proveedores de concreto"
          description="Se eligen en el registro de campo."
          placeholder="CEMEX"
        />
        <CatalogCard
          kind="cement-types"
          title="Tipos de cemento"
          description="Se eligen en el registro de campo y en la remisión de cada camión."
          placeholder="CPC-40"
        />
      </div>
      <HolidaysCard />
    </div>
  );
}
