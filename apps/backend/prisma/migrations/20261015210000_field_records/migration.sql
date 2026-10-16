-- CreateEnum
CREATE TYPE "FieldRecordStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SpecimenStatus" AS ENUM ('CREATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StrengthCriterion" AS ENUM ('FC', 'MR');

-- CreateEnum
CREATE TYPE "ConcreteProduction" AS ENUM ('SITE_MIXED', 'READY_MIXED');

-- CreateEnum
CREATE TYPE "SkyCondition" AS ENUM ('SUNNY', 'CLOUDY', 'RAINY');

-- CreateEnum
CREATE TYPE "WindCondition" AS ENUM ('WINDY', 'CALM');

-- CreateEnum
CREATE TYPE "LightingCondition" AS ENUM ('NATURAL', 'ARTIFICIAL');

-- CreateEnum
CREATE TYPE "SpecimenType" AS ENUM ('CYLINDER_15X30', 'CYLINDER_10X20', 'BEAM_15X60', 'BEAM_15X50', 'CUBE_15', 'CUBE_10');

-- CreateTable
CREATE TABLE "field_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "status" "FieldRecordStatus" NOT NULL DEFAULT 'DRAFT',
    "registry_sequence" INTEGER,
    "front_number" INTEGER NOT NULL DEFAULT 1,
    "pour_date" DATE NOT NULL,
    "supplier_id" UUID,
    "production" "ConcreteProduction",
    "strength_criterion" "StrengthCriterion",
    "specified_strength_kg_cm2" DECIMAL(6,1),
    "specified_slump_cm" DECIMAL(4,1),
    "specified_slump_tolerance_cm" DECIMAL(4,1),
    "max_aggregate_size_mm" DECIMAL(5,1),
    "cement_type_id" UUID,
    "design_age_days" INTEGER,
    "screened" BOOLEAN,
    "screen_mesh" TEXT,
    "sky_condition" "SkyCondition",
    "wind_condition" "WindCondition",
    "lighting_condition" "LightingCondition",
    "relative_humidity_pct" DECIMAL(4,1),
    "thermometer_code" TEXT,
    "hygrometer_code" TEXT,
    "slump_cone_code" TEXT,
    "tape_measure_code" TEXT,
    "strike_off_bar_code" TEXT,
    "slump_rod_code" TEXT,
    "sampling_rod_code" TEXT,
    "wheelbarrow_code" TEXT,
    "unit_weight_scale_code" TEXT,
    "unit_weight_mold_code" TEXT,
    "unit_weight_tare_g" DECIMAL(9,1),
    "unit_weight_tare_sample_g" DECIMAL(9,1),
    "unit_weight_mold_factor" DECIMAL(10,4),
    "air_meter_code" TEXT,
    "air_content_pct" DECIMAL(4,1),
    "programmed_element" TEXT,
    "cast_element" TEXT,
    "observations" TEXT,
    "sampler_name" TEXT,
    "approved_by_name" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "field_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "field_record_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "ticket_number" TEXT,
    "volume_m3" DECIMAL(6,2),
    "plant_departure_time" TIME(0),
    "site_arrival_time" TIME(0),
    "pour_start_time" TIME(0),
    "pour_end_time" TIME(0),
    "ambient_temperature_c" DECIMAL(4,1),
    "concrete_temperature_c" DECIMAL(4,1),
    "slump_1_cm" DECIMAL(4,1),
    "slump_2_cm" DECIMAL(4,1),
    "ticket_strength_kg_cm2" DECIMAL(6,1),
    "ticket_slump_cm" DECIMAL(4,1),
    "ticket_slump_tolerance_cm" DECIMAL(4,1),
    "ticket_max_aggregate_mm" DECIMAL(5,1),
    "ticket_cement_type_id" UUID,
    "ticket_design_age_days" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samples" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "delivery_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sample_number" INTEGER,
    "specimen_type" "SpecimenType",
    "molded_at" TIME(0),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specimens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sample_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "status" "SpecimenStatus" NOT NULL DEFAULT 'CREATED',
    "specimen_number" INTEGER,
    "mold_code" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "specimens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_records_tenant_id_project_id_pour_date_idx" ON "field_records"("tenant_id", "project_id", "pour_date");

-- CreateIndex
CREATE INDEX "field_records_tenant_id_status_idx" ON "field_records"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "field_records_id_tenant_id_key" ON "field_records"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "field_records_project_id_registry_sequence_key" ON "field_records"("project_id", "registry_sequence");

-- CreateIndex
CREATE INDEX "deliveries_tenant_id_field_record_id_idx" ON "deliveries"("tenant_id", "field_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_id_tenant_id_key" ON "deliveries"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_field_record_id_sequence_key" ON "deliveries"("field_record_id", "sequence");

-- CreateIndex
CREATE INDEX "samples_tenant_id_delivery_id_idx" ON "samples"("tenant_id", "delivery_id");

-- CreateIndex
CREATE UNIQUE INDEX "samples_id_tenant_id_key" ON "samples"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "samples_project_id_sample_number_key" ON "samples"("project_id", "sample_number");

-- CreateIndex
CREATE INDEX "specimens_tenant_id_sample_id_idx" ON "specimens"("tenant_id", "sample_id");

-- CreateIndex
CREATE UNIQUE INDEX "specimens_id_tenant_id_key" ON "specimens"("id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "specimens_project_id_specimen_number_key" ON "specimens"("project_id", "specimen_number");

-- AddForeignKey
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_project_id_tenant_id_fkey" FOREIGN KEY ("project_id", "tenant_id") REFERENCES "projects"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_supplier_id_tenant_id_fkey" FOREIGN KEY ("supplier_id", "tenant_id") REFERENCES "concrete_suppliers"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_records" ADD CONSTRAINT "field_records_cement_type_id_tenant_id_fkey" FOREIGN KEY ("cement_type_id", "tenant_id") REFERENCES "cement_types"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_field_record_id_tenant_id_fkey" FOREIGN KEY ("field_record_id", "tenant_id") REFERENCES "field_records"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_ticket_cement_type_id_tenant_id_fkey" FOREIGN KEY ("ticket_cement_type_id", "tenant_id") REFERENCES "cement_types"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_delivery_id_tenant_id_fkey" FOREIGN KEY ("delivery_id", "tenant_id") REFERENCES "deliveries"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_project_id_tenant_id_fkey" FOREIGN KEY ("project_id", "tenant_id") REFERENCES "projects"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_sample_id_tenant_id_fkey" FOREIGN KEY ("sample_id", "tenant_id") REFERENCES "samples"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specimens" ADD CONSTRAINT "specimens_project_id_tenant_id_fkey" FOREIGN KEY ("project_id", "tenant_id") REFERENCES "projects"("id", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Not expressible in Prisma: lab numbers and sequences are positive.
ALTER TABLE "field_records"
  ADD CONSTRAINT "field_records_registry_sequence_positive" CHECK ("registry_sequence" > 0),
  ADD CONSTRAINT "field_records_front_number_positive" CHECK ("front_number" > 0);
ALTER TABLE "deliveries"
  ADD CONSTRAINT "deliveries_sequence_positive" CHECK ("sequence" > 0);
ALTER TABLE "samples"
  ADD CONSTRAINT "samples_sample_number_positive" CHECK ("sample_number" > 0);
ALTER TABLE "specimens"
  ADD CONSTRAINT "specimens_specimen_number_positive" CHECK ("specimen_number" > 0);
