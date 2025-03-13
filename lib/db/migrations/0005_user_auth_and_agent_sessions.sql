-- Add new columns to User table
ALTER TABLE "User" 
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "privyDID" varchar(255),
  ADD COLUMN IF NOT EXISTS "walletAddress" varchar(255),
  ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verificationDate" timestamp,
  ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now();

-- Create UserSession table
CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "loginMethod" varchar NOT NULL,
  "ipAddress" varchar(45),
  "userAgent" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "expiresAt" timestamp,
  "isActive" boolean NOT NULL DEFAULT true
);

-- Add updatedAt to Chat table
ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT now();

-- Update default for createdAt in existing tables
ALTER TABLE "Chat" 
  ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE "Message" 
  ALTER COLUMN "createdAt" SET DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "isAgentGenerated" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "agentType" varchar(64);

-- Fix column name in Document table
ALTER TABLE "Document" 
  RENAME COLUMN "text" TO "kind";

ALTER TABLE "Document" 
  ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE "Suggestion" 
  ALTER COLUMN "createdAt" SET DEFAULT now();

-- Create AgentSession table
CREATE TABLE IF NOT EXISTS "AgentSession" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "agentType" varchar(64) NOT NULL,
  "startedAt" timestamp NOT NULL DEFAULT now(),
  "endedAt" timestamp,
  "status" varchar NOT NULL DEFAULT 'active',
  "metadata" jsonb
);

-- Create AgentExecutionLog table
CREATE TABLE IF NOT EXISTS "AgentExecutionLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agentSessionId" uuid NOT NULL REFERENCES "AgentSession"("id"),
  "stepId" varchar(64) NOT NULL,
  "stepName" varchar(128) NOT NULL,
  "status" varchar NOT NULL,
  "message" text,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "metadata" jsonb
);

-- Create BlockchainExploration table
CREATE TABLE IF NOT EXISTS "BlockchainExploration" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "documentId" uuid NOT NULL REFERENCES "Document"("id"),
  "query" text NOT NULL,
  "address" varchar(255),
  "network" varchar(64),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "completedAt" timestamp,
  "status" varchar NOT NULL DEFAULT 'pending',
  "results" jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_privyDID" ON "User"("privyDID");
CREATE INDEX IF NOT EXISTS "idx_user_walletAddress" ON "User"("walletAddress");
CREATE INDEX IF NOT EXISTS "idx_userSession_userId" ON "UserSession"("userId");
CREATE INDEX IF NOT EXISTS "idx_agentSession_userId" ON "AgentSession"("userId");
CREATE INDEX IF NOT EXISTS "idx_agentSession_chatId" ON "AgentSession"("chatId");
CREATE INDEX IF NOT EXISTS "idx_agentExecutionLog_agentSessionId" ON "AgentExecutionLog"("agentSessionId");
CREATE INDEX IF NOT EXISTS "idx_blockchainExploration_userId" ON "BlockchainExploration"("userId");
CREATE INDEX IF NOT EXISTS "idx_blockchainExploration_documentId" ON "BlockchainExploration"("documentId"); 