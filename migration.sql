DROP TABLE IF EXISTS "Report" CASCADE;
DROP TABLE IF EXISTS "Wishlist" CASCADE;
DROP TABLE IF EXISTS "PushSubscription" CASCADE;
DROP TABLE IF EXISTS "PriceAlert" CASCADE;
DROP TABLE IF EXISTS "RemoteSession" CASCADE;
DROP TABLE IF EXISTS "RobloxVerification" CASCADE;
DROP TABLE IF EXISTS "OtpChallenge" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "UserItem" CASCADE;
DROP TABLE IF EXISTS "SellerItem" CASCADE;
DROP TABLE IF EXISTS "SellerProfile" CASCADE;
DROP TABLE IF EXISTS "Seller" CASCADE;
DROP TABLE IF EXISTS "Item" CASCADE;
DROP TABLE IF EXISTS "DepositOrder" CASCADE;
DROP TABLE IF EXISTS "Withdrawal" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "Follow" CASCADE;
DROP TABLE IF EXISTS "AssetComment" CASCADE;
DROP TABLE IF EXISTS "AssetReview" CASCADE;
DROP TABLE IF EXISTS "AssetDownload" CASCADE;
DROP TABLE IF EXISTS "AssetLike" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Asset" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT UNIQUE NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "aboutMe" TEXT,
  "avatarUrl" TEXT,
  "robloxId" TEXT,
  "robloxUsername" TEXT,
  "robloxCookie" TEXT,
  "robloxUserId" TEXT,
  "universeId" TEXT,
  "gmail" TEXT,
  "gmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "jti" UUID UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "device" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "ip" TEXT,
  "lastSeen" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Asset" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "price" TEXT NOT NULL DEFAULT 'Free',
  "priceRobux" INTEGER,
  "thumbnailUrl" TEXT NOT NULL,
  "videoUrl" TEXT,
  "assetFileUrl" TEXT NOT NULL,
  "assetType" TEXT NOT NULL DEFAULT 'rbxm',
  "fileSize" INTEGER NOT NULL DEFAULT 0,
  "folderId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUE',
  "rejectionReason" TEXT,
  "likesCount" INTEGER NOT NULL DEFAULT 0,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "AssetLike" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL REFERENCES "Asset"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("assetId", "userId")
);

CREATE TABLE "AssetDownload" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL REFERENCES "Asset"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "AssetReview" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL REFERENCES "Asset"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("assetId", "userId")
);

CREATE TABLE "AssetComment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" UUID NOT NULL REFERENCES "Asset"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Follow" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "followerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "followingId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("followerId", "followingId")
);

CREATE TABLE "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Withdrawal" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "amount" DOUBLE PRECISION NOT NULL,
  "queuePos" INTEGER NOT NULL DEFAULT 0,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "DepositOrder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "usdAmount" DOUBLE PRECISION NOT NULL,
  "robuxAmount" DOUBLE PRECISION NOT NULL,
  "paymentMethod" TEXT,
  "paymentUrl" TEXT,
  "gamepassId" TEXT,
  "robloxUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Item" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "robloxAssetId" BIGINT UNIQUE,
  "rarity" TEXT,
  "category" TEXT,
  "price" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Seller" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "SellerProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "robloxUsername" TEXT,
  "robloxId" TEXT,
  "avatarUrl" TEXT,
  "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalSales" INTEGER NOT NULL DEFAULT 0,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "SellerItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sellerId" UUID NOT NULL REFERENCES "SellerProfile"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "priceRobux" INTEGER,
  "priceUsd" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "UserItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "itemId")
);

CREATE TABLE "Order" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "buyerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "robloxUser" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Transaction" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "sellerId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "price" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" TEXT NOT NULL,
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "target" TEXT,
  "ip" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "OtpChallenge" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "channel" TEXT,
  "target" TEXT,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "consumedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "RobloxVerification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "robloxUsername" TEXT NOT NULL,
  "robloxId" TEXT NOT NULL,
  "phrase" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "RemoteSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" TEXT UNIQUE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "hostname" TEXT,
  "username" TEXT,
  "ip" TEXT,
  "os" TEXT,
  "screen" TEXT,
  "adminId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "approvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "PriceAlert" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "onPriceUp" BOOLEAN NOT NULL DEFAULT false,
  "onPriceDown" BOOLEAN NOT NULL DEFAULT false,
  "onRapUp" BOOLEAN NOT NULL DEFAULT false,
  "onRapDown" BOOLEAN NOT NULL DEFAULT false,
  "duration" TEXT NOT NULL DEFAULT '24h',
  "lastPrice" DOUBLE PRECISION,
  "lastRap" DOUBLE PRECISION,
  "lastNotifiedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "itemId")
);

CREATE TABLE "PushSubscription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL,
  "keys" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(endpoint)
);

CREATE TABLE "Wishlist" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES "Item"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "itemId")
);

CREATE TABLE "Report" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporterId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "target" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
