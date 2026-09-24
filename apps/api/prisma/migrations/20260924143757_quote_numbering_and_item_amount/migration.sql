/*
  Warnings:

  - Added the required column `amount` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastQuoteNumber" INTEGER NOT NULL DEFAULT 0;
