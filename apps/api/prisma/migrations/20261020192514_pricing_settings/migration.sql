-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyNetIncome" DECIMAL(12,2) NOT NULL,
    "costEquipment" DECIMAL(12,2) NOT NULL,
    "costTools" DECIMAL(12,2) NOT NULL,
    "costOffice" DECIMAL(12,2) NOT NULL,
    "costTransport" DECIMAL(12,2) NOT NULL,
    "costServices" DECIMAL(12,2) NOT NULL,
    "costAdvertising" DECIMAL(12,2) NOT NULL,
    "marginPercent" DECIMAL(5,2) NOT NULL,
    "taxReservePercent" DECIMAL(5,2) NOT NULL,
    "billableHoursPerMonth" DECIMAL(6,2) NOT NULL,
    "hourlyRate" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingSettings_userId_key" ON "PricingSettings"("userId");

-- AddForeignKey
ALTER TABLE "PricingSettings" ADD CONSTRAINT "PricingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
