-- AlterTable
ALTER TABLE "Item" ADD COLUMN "robloxAssetId" INTEGER NOT NULL;
ALTER TABLE "Item" ADD COLUMN "demand" INTEGER NOT NULL DEFAULT -1;
ALTER TABLE "Item" ADD COLUMN "trend" INTEGER NOT NULL DEFAULT -1;

-- CreateIndex
CREATE UNIQUE INDEX "Item_robloxAssetId_key" ON "Item"("robloxAssetId");
