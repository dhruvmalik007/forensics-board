-- Initial schema migration based on the schema.ts definitions

-- User table with Privy authentication and verification
CREATE TABLE IF NOT EXISTS User (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(64),
  privyDID VARCHAR(255),
  walletAddress VARCHAR(255),
  isVerified BOOLEAN DEFAULT FALSE,
  verificationDate TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User session table to track login sessions
CREATE TABLE IF NOT EXISTS UserSession (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  loginMethod ENUM('email', 'wallet') NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Chat table for messaging
CREATE TABLE IF NOT EXISTS Chat (
  id CHAR(36) PRIMARY KEY,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  userId CHAR(36) NOT NULL,
  visibility ENUM('public', 'private') NOT NULL DEFAULT 'private',
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Message table for chat messages
CREATE TABLE IF NOT EXISTS Message (
  id CHAR(36) PRIMARY KEY,
  chatId CHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL,
  content JSON NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isAgentGenerated BOOLEAN DEFAULT FALSE,
  agentType VARCHAR(64),
  FOREIGN KEY (chatId) REFERENCES Chat(id)
);

-- Agent session table to track agent interactions
CREATE TABLE IF NOT EXISTS AgentSession (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  chatId CHAR(36) NOT NULL,
  agentType VARCHAR(64) NOT NULL,
  startedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  endedAt TIMESTAMP,
  status ENUM('active', 'completed', 'failed') NOT NULL DEFAULT 'active',
  metadata JSON,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (chatId) REFERENCES Chat(id)
);

-- Agent execution logs for detailed tracking
CREATE TABLE IF NOT EXISTS AgentExecutionLog (
  id CHAR(36) PRIMARY KEY,
  agentSessionId CHAR(36) NOT NULL,
  stepId VARCHAR(64) NOT NULL,
  stepName VARCHAR(128) NOT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL,
  message TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  FOREIGN KEY (agentSessionId) REFERENCES AgentSession(id)
);

-- Vote table for message voting
CREATE TABLE IF NOT EXISTS Vote (
  chatId CHAR(36) NOT NULL,
  messageId CHAR(36) NOT NULL,
  isUpvoted BOOLEAN NOT NULL,
  PRIMARY KEY (chatId, messageId),
  FOREIGN KEY (chatId) REFERENCES Chat(id),
  FOREIGN KEY (messageId) REFERENCES Message(id)
);

-- Document table for storing documents
CREATE TABLE IF NOT EXISTS Document (
  id CHAR(36) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL,
  content TEXT,
  kind ENUM('text', 'code', 'image', 'sheet', 'blockchain-explorer') NOT NULL DEFAULT 'text',
  userId CHAR(36) NOT NULL,
  PRIMARY KEY (id, createdAt),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Blockchain exploration results
CREATE TABLE IF NOT EXISTS BlockchainExploration (
  id CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  documentId CHAR(36) NOT NULL,
  query TEXT NOT NULL,
  address VARCHAR(255),
  network VARCHAR(64),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP,
  status ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  results JSON,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (documentId) REFERENCES Document(id)
);

-- Suggestion table for document suggestions
CREATE TABLE IF NOT EXISTS Suggestion (
  id CHAR(36) PRIMARY KEY,
  documentId CHAR(36) NOT NULL,
  documentCreatedAt TIMESTAMP NOT NULL,
  originalText TEXT NOT NULL,
  suggestedText TEXT NOT NULL,
  description TEXT,
  isResolved BOOLEAN NOT NULL DEFAULT FALSE,
  userId CHAR(36) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (documentId, documentCreatedAt) REFERENCES Document(id, createdAt)
); 