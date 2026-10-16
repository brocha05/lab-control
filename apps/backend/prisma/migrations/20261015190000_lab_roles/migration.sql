-- Real roles from the lab's hierarchy (questionnaire Q-39, Q-40). Hand-written so the
-- existing users keep their role: ADMIN becomes the Jefe de Control de Calidad,
-- MEMBER the Coordinador del SGC.
ALTER TYPE "UserRole" RENAME VALUE 'ADMIN' TO 'QUALITY_MANAGER';
ALTER TYPE "UserRole" RENAME VALUE 'MEMBER' TO 'QMS_COORDINATOR';
ALTER TYPE "UserRole" ADD VALUE 'LAB_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'FIELD_CREW_CHIEF';

-- Every user gets an explicit role.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
