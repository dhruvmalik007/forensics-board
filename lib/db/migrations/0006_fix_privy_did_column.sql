-- Fix privyDID column in User table
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "privyDID" varchar(255);

-- Recreate the index for privyDID
DROP INDEX IF EXISTS "idx_user_privyDID";
CREATE INDEX "idx_user_privyDID" ON "User"("privyDID");

-- Make sure other required columns exist
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "walletAddress" varchar(255),
  ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verificationDate" timestamp,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now(); 