-- CreateEnum
CREATE TYPE "SpecimenTestStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "specimen_tests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "specimen_id" UUID NOT NULL,
    "age_days" INTEGER NOT NULL,
    "keep_exact_date" BOOLEAN NOT NULL DEFAULT false,
    "status" "SpecimenTestStatus" NOT NULL DEFAULT 'SCHEDULED',
    "test_date" DATE,
    "test_time" TIME(0),
    "height_1_cm" DECIMAL(4,1),
    "height_2_cm" DECIMAL(4,1),
    "diameter_1_cm" DECIMAL(4,1),
    "diameter_2_cm" DECIMAL(4,1),
    "max_load_kgf" DECIMAL(9,1),
    "load_duration_s" INTEGER,
    "failure_type" SMALLINT,
    "press_code" TEXT,
    "dimension_equipment" TEXT,
    "performed_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "specimen_tests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "specimen_tests_tenant_id_status_idx" ON "specimen_tests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "specimen_tests_tenant_id_specimen_id_idx" ON "specimen_tests"("tenant_id", "specimen_id");

-- CreateIndex
CREATE INDEX "specimen_tests_tenant_id_test_date_idx" ON "specimen_tests"("tenant_id", "test_date");

-- AddForeignKey
ALTER TABLE "specimen_tests" ADD CONSTRAINT "specimen_tests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specimen_tests" ADD CONSTRAINT "specimen_tests_specimen_id_tenant_id_fkey" FOREIGN KEY ("specimen_id", "tenant_id") REFERENCES "specimens"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Not expressible in Prisma: planned ages are positive.
ALTER TABLE "specimen_tests"
  ADD CONSTRAINT "specimen_tests_age_days_positive" CHECK ("age_days" > 0);
