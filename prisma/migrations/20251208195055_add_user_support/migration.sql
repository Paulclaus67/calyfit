/*
  Warnings:

  - Added the required column `userId` to the `SessionHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `WeekPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "finishedAt" DATETIME NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "totalCompletedSets" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SessionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionHistory_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SessionHistory" ("durationSeconds", "finishedAt", "id", "sessionId", "totalCompletedSets") SELECT "durationSeconds", "finishedAt", "id", "sessionId", "totalCompletedSets" FROM "SessionHistory";
DROP TABLE "SessionHistory";
ALTER TABLE "new_SessionHistory" RENAME TO "SessionHistory";
CREATE TABLE "new_WeekPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "WeekPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WeekPlan" ("id", "name") SELECT "id", "name" FROM "WeekPlan";
DROP TABLE "WeekPlan";
ALTER TABLE "new_WeekPlan" RENAME TO "WeekPlan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
