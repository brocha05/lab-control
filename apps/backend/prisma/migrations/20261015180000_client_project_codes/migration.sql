-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "code" TEXT;
-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "code" TEXT;
-- CreateIndex
CREATE UNIQUE INDEX "clients_tenant_id_code_key" ON "clients"("tenant_id", "code");
-- CreateIndex
CREATE UNIQUE INDEX "projects_client_id_code_key" ON "projects"("client_id", "code");
