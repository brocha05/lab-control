-- CreateTable
CREATE TABLE "holidays" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concrete_suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "concrete_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cement_types" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "cement_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holidays_tenant_id_date_key" ON "holidays"("tenant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "concrete_suppliers_id_tenant_id_key" ON "concrete_suppliers"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "concrete_suppliers_tenant_id_name_key" ON "concrete_suppliers"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "cement_types_id_tenant_id_key" ON "cement_types"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cement_types_tenant_id_name_key" ON "cement_types"("tenant_id", "name");

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concrete_suppliers" ADD CONSTRAINT "concrete_suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cement_types" ADD CONSTRAINT "cement_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

