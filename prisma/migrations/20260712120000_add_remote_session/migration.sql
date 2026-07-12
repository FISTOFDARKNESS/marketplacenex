-- CreateTable
CREATE TABLE "RemoteSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "hostname" TEXT,
    "username" TEXT,
    "ip" TEXT,
    "os" TEXT,
    "screen" TEXT,
    "note" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "RemoteSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RemoteSession_token_key" ON "RemoteSession"("token");

-- CreateIndex
CREATE INDEX "RemoteSession_status_idx" ON "RemoteSession"("status");

-- CreateIndex
CREATE INDEX "RemoteSession_createdAt_idx" ON "RemoteSession"("createdAt");
