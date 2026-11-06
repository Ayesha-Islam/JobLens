/*
  Warnings:

  - A unique constraint covering the columns `[auth_ticket]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_ticket" TEXT,
ADD COLUMN     "auth_ticket_expires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_ticket_key" ON "users"("auth_ticket");
