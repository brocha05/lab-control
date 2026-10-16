import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/PageHeader';
import { CatalogCard } from '@/modules/catalogs/components/CatalogCard';
import { HolidaysCard } from '@/modules/catalogs/components/HolidaysCard';

export const metadata: Metadata = { title: 'Configuración' };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Listas y calendario del laboratorio" />
      <div className="grid gap-6 lg:grid-cols-2">
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
