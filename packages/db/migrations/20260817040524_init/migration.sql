-- CreateEnum
CREATE TYPE "DealMode" AS ENUM ('FLIGHT', 'CRUISE');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('PENDING', 'LIVE', 'EXPIRED');

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "originAirports" TEXT[],
    "originPorts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "mode" "DealMode" NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "cabinClass" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "rawJson" JSONB,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "mode" "DealMode" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "baselinePrice" DOUBLE PRECISION NOT NULL,
    "discountPct" INTEGER NOT NULL,
    "stops" INTEGER,
    "nights" INTEGER,
    "baggageIncluded" BOOLEAN,
    "affiliateUrl" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "marketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Route_mode_destination_idx" ON "Route"("mode", "destination");

-- CreateIndex
CREATE UNIQUE INDEX "Route_marketId_mode_origin_destination_cabinClass_key" ON "Route"("marketId", "mode", "origin", "destination", "cabinClass");

-- CreateIndex
CREATE INDEX "PriceSnapshot_routeId_observedAt_idx" ON "PriceSnapshot"("routeId", "observedAt");

-- CreateIndex
CREATE INDEX "Deal_status_mode_idx" ON "Deal"("status", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSubscriber_email_key" ON "EmailSubscriber"("email");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSubscriber" ADD CONSTRAINT "EmailSubscriber_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
