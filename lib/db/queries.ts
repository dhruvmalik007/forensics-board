import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import { MySQLClient } from './mysql-client';
import { ArtifactKind } from '@/components/artifact';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Get the MySQL client instance
import { getMySQLClient } from './index';

let mysqlClient: MySQLClient;

// Ensure we have a MySQL client
const ensureClient = async (): Promise<void> => {
  if (!mysqlClient) {
    mysqlClient = await getMySQLClient();
  }
};

// User Management Functions

export async function getUser(email: string): Promise<Array<any>> {
  try {
    await ensureClient();
    return await mysqlClient.query('SELECT * FROM User WHERE email = ?', [email]);
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function getUserByPrivyDID(privyDID: string): Promise<any | undefined> {
  try {
    await ensureClient();
    const users = await mysqlClient.query('SELECT * FROM User WHERE privyDID = ?', [privyDID]);
    return users[0];
  } catch (error) {
    console.error('Failed to get user by Privy DID from database');
    throw error;
  }
}

export async function getUserByWalletAddress(walletAddress: string): Promise<any | undefined> {
  try {
    await ensureClient();
    const users = await mysqlClient.query('SELECT * FROM User WHERE walletAddress = ?', [walletAddress]);
    return users[0];
  } catch (error) {
    console.error('Failed to get user by wallet address from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  const id = uuidv4();
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'INSERT INTO User (id, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [id, email, hash, now, now]
    );
    return { id, email };
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function createPrivyUser({ 
  privyDID, 
  email, 
  walletAddress 
}: { 
  privyDID: string; 
  email?: string; 
  walletAddress?: string;
}) {
  const id = uuidv4();
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'INSERT INTO User (id, privyDID, email, walletAddress, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, privyDID, email || null, walletAddress || null, now, now]
    );
    return { id, privyDID, email, walletAddress };
  } catch (error) {
    console.error('Failed to create Privy user in database');
    throw error;
  }
}

export async function updateUserVerificationStatus({
  userId,
  isVerified
}: {
  userId: string;
  isVerified: boolean;
}) {
  const now = new Date();
  const verificationDate = isVerified ? now : null;

  try {
    await ensureClient();
    await mysqlClient.query(
      'UPDATE User SET isVerified = ?, verificationDate = ?, updatedAt = ? WHERE id = ?',
      [isVerified, verificationDate, now, userId]
    );
    return { userId, isVerified, verificationDate };
  } catch (error) {
    console.error('Failed to update user verification status in database');
    throw error;
  }
}

export async function updateUserWalletAddress({
  userId,
  walletAddress
}: {
  userId: string;
  walletAddress: string;
}) {
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'UPDATE User SET walletAddress = ?, updatedAt = ? WHERE id = ?',
      [walletAddress, now, userId]
    );
    return { userId, walletAddress };
  } catch (error) {
    console.error('Failed to update user wallet address in database');
    throw error;
  }
}

// User Session Management

export async function createUserSession({
  userId,
  loginMethod,
  ipAddress,
  userAgent,
  expiresAt
}: {
  userId: string;
  loginMethod: 'email' | 'wallet';
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'INSERT INTO UserSession (id, userId, loginMethod, ipAddress, userAgent, createdAt, expiresAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, loginMethod, ipAddress || null, userAgent || null, now, expiresAt || null, true]
    );
    
    const sessions = await mysqlClient.query(
      'SELECT * FROM UserSession WHERE id = ?',
      [id]
    );
    
    return sessions[0];
  } catch (error) {
    console.error('Failed to create user session in database');
    throw error;
  }
}

export async function deactivateUserSession(sessionId: string) {
  try {
    await ensureClient();
    await mysqlClient.query(
      'UPDATE UserSession SET isActive = ? WHERE id = ?',
      [false, sessionId]
    );
    return { sessionId, isActive: false };
  } catch (error) {
    console.error('Failed to deactivate user session in database');
    throw error;
  }
}

export async function getActiveUserSessions(userId: string): Promise<any[]> {
  try {
    await ensureClient();
    return await mysqlClient.query(
      'SELECT * FROM UserSession WHERE userId = ? AND isActive = ?',
      [userId, true]
    );
  } catch (error) {
    console.error('Failed to get active user sessions from database');
    throw error;
  }
}

// Agent Session Management

export async function createAgentSession({
  userId,
  chatId,
  agentType,
  metadata
}: {
  userId: string;
  chatId: string;
  agentType: string;
  metadata?: any;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'INSERT INTO AgentSession (id, userId, chatId, agentType, startedAt, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, chatId, agentType, now, 'active', metadata || null]
    );
    
    const sessions = await mysqlClient.query(
      'SELECT * FROM AgentSession WHERE id = ?',
      [id]
    );
    
    return sessions[0];
  } catch (error) {
    console.error('Failed to create agent session in database');
    throw error;
  }
}

export async function updateAgentSessionStatus({
  sessionId,
  status,
  metadata
}: {
  sessionId: string;
  status: 'active' | 'completed' | 'failed';
  metadata?: any;
}) {
  const now = new Date();
  const updates: any = { status };
  
  if (status === 'completed' || status === 'failed') {
    updates.endedAt = now;
  }
  
  if (metadata) {
    updates.metadata = metadata;
  }

  try {
    await ensureClient();
    await mysqlClient.query(
      'UPDATE AgentSession SET status = ?, endedAt = ?, metadata = ? WHERE id = ?',
      [status, status === 'completed' || status === 'failed' ? now : null, metadata, sessionId]
    );
    return { sessionId, status, endedAt: updates.endedAt, metadata: updates.metadata };
  } catch (error) {
    console.error('Failed to update agent session status in database');
    throw error;
  }
}

export async function getAgentSessionsByUserId(userId: string): Promise<any[]> {
  try {
    await ensureClient();
    return await mysqlClient.query(
      'SELECT * FROM AgentSession WHERE userId = ? ORDER BY startedAt DESC',
      [userId]
    );
  } catch (error) {
    console.error('Failed to get agent sessions by user ID from database');
    throw error;
  }
}

export async function getAgentSessionById(sessionId: string): Promise<any | undefined> {
  try {
    await ensureClient();
    const sessions = await mysqlClient.query(
      'SELECT * FROM AgentSession WHERE id = ?',
      [sessionId]
    );
    return sessions[0];
  } catch (error) {
    console.error('Failed to get agent session by ID from database');
    throw error;
  }
}

// Agent Execution Logs

export async function createAgentExecutionLog({
  agentSessionId,
  stepId,
  stepName,
  status,
  message,
  metadata
}: {
  agentSessionId: string;
  stepId: string;
  stepName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
  metadata?: any;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'INSERT INTO AgentExecutionLog (id, agentSessionId, stepId, stepName, status, message, timestamp, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, agentSessionId, stepId, stepName, status, message, now, metadata || null]
    );
    
    const logs = await mysqlClient.query(
      'SELECT * FROM AgentExecutionLog WHERE id = ?',
      [id]
    );
    
    return logs[0];
  } catch (error) {
    console.error('Failed to create agent execution log in database');
    throw error;
  }
}

export async function getAgentExecutionLogsBySessionId(sessionId: string): Promise<any[]> {
  try {
    await ensureClient();
    return await mysqlClient.query(
      'SELECT * FROM AgentExecutionLog WHERE agentSessionId = ? ORDER BY timestamp ASC',
      [sessionId]
    );
  } catch (error) {
    console.error('Failed to get agent execution logs by session ID from database');
    throw error;
  }
}

// Blockchain Exploration

export async function createBlockchainExploration({
  userId,
  documentId,
  query,
  address,
  network
}: {
  userId: string;
  documentId: string;
  query: string;
  address?: string;
  network?: string;
}): Promise<any> {
  const id = uuidv4();
  const now = new Date();

  try {
    await ensureClient();
    await mysqlClient.query(
      'INSERT INTO BlockchainExploration (id, userId, documentId, query, address, network, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, documentId, query, address, network, now, 'pending']
    );
    
    const explorations = await mysqlClient.query(
      'SELECT * FROM BlockchainExploration WHERE id = ?',
      [id]
    );
    
    return explorations[0];
  } catch (error) {
    console.error('Failed to create blockchain exploration in database');
    throw error;
  }
}

export async function updateBlockchainExplorationStatus({
  id,
  status,
  results
}: {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: any;
}) {
  const now = new Date();
  const updates: any = { status };
  
  if (status === 'completed' || status === 'failed') {
    updates.completedAt = now;
  }
  
  if (results) {
    updates.results = results;
  }

  try {
    await ensureClient();
    await mysqlClient.query(
      'UPDATE BlockchainExploration SET status = ?, completedAt = ?, results = ? WHERE id = ?',
      [status, status === 'completed' || status === 'failed' ? now : null, results, id]
    );
    return { id, status, completedAt: updates.completedAt, results: updates.results };
  } catch (error) {
    console.error('Failed to update blockchain exploration status in database');
    throw error;
  }
}

export async function getBlockchainExplorationsByUserId(userId: string): Promise<any[]> {
  try {
    await ensureClient();
    return await mysqlClient.query(
      'SELECT * FROM BlockchainExploration WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
  } catch (error) {
    console.error('Failed to get blockchain explorations by user ID from database');
    throw error;
  }
}

export async function deleteBlockchainExploration(id: string): Promise<void> {
  try {
    await ensureClient();
    await mysqlClient.query(
      'DELETE FROM BlockchainExploration WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Failed to delete blockchain exploration from database');
    throw error;
  }
}

// Existing functions

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ 
  messages,
  isAgentGenerated = false,
  agentType = null
}: { 
  messages: Array<Omit<Message, 'isAgentGenerated' | 'agentType'>>;
  isAgentGenerated?: boolean;
  agentType?: string | null;
}) {
  try {
    const messagesWithAgentInfo = messages.map(msg => ({
      ...msg,
      isAgentGenerated,
      agentType
    }));
    
    return await db.insert(message).values(messagesWithAgentInfo);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
