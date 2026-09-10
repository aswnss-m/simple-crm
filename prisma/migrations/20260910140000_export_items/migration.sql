-- AlterTable
ALTER TABLE "lead" ADD COLUMN "exportCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "export_item" (
    "exportId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,

    CONSTRAINT "export_item_pkey" PRIMARY KEY ("exportId","leadId")
);

-- CreateIndex
CREATE INDEX "export_item_leadId_idx" ON "export_item"("leadId");

-- AddForeignKey
ALTER TABLE "export_item" ADD CONSTRAINT "export_item_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "export"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_item" ADD CONSTRAINT "export_item_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
