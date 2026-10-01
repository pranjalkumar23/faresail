-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "airline" TEXT,
ADD COLUMN     "departureAt" TIMESTAMP(3),
ADD COLUMN     "departureMonth" TEXT;

-- AlterTable
ALTER TABLE "PriceSnapshot" ADD COLUMN     "departureAt" TIMESTAMP(3),
ADD COLUMN     "departureMonth" TEXT;

-- CreateIndex
CREATE INDEX "Deal_status_departureMonth_idx" ON "Deal"("status", "departureMonth");

-- CreateIndex
CREATE INDEX "PriceSnapshot_routeId_departureMonth_observedAt_idx" ON "PriceSnapshot"("routeId", "departureMonth", "observedAt");
