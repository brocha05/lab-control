-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'FINAL');

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "field_record_id" UUID NOT NULL,
    "template_key" TEXT NOT NULL,
    "template_version" TEXT,
    "version" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "report_number" TEXT,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "mixing_equipment" TEXT,
    "compaction_method" TEXT,
    "mix_design_reference" TEXT,
    "admixture" TEXT,
    "observations" TEXT,
    "snapshot" JSONB,
    "snapshot_schema_version" INTEGER,
    "storage_key" TEXT,
    "content_sha256" TEXT,
    "generated_at" TIMESTAMPTZ,
    "generated_by_id" UUID,
    "finalized_at" TIMESTAMPTZ,
    "finalized_by_id" UUID,
    "superseded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_tenant_id_status_idx" ON "reports"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "reports_tenant_id_report_number_idx" ON "reports"("tenant_id", "report_number");

-- CreateIndex
CREATE UNIQUE INDEX "reports_tenant_id_field_record_id_template_key_version_key" ON "reports"("tenant_id", "field_record_id", "template_key", "version");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_field_record_id_tenant_id_fkey" FOREIGN KEY ("field_record_id", "tenant_id") REFERENCES "field_records"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

