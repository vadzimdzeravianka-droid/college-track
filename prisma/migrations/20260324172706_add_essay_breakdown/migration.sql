-- AlterTable
ALTER TABLE "checklists" ADD COLUMN "main_essay_complete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "checklists" ADD COLUMN "supplemental_essays_completed" INTEGER NOT NULL DEFAULT 0;
