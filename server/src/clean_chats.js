import Message from './models/Message.js';
import Conversation from './models/Conversation.js';

/**
 * Automated 48-Hour Chat Cleanup Task
 * Permanently deletes messages and chat conversations from MongoDB older than 48 hours.
 */
export async function autoCleanupOldChats() {
  try {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - THIRTY_DAYS_MS);

    // 1. Purge messages older than 30 days
    const deletedMessages = await Message.deleteMany({ createdAt: { $lt: cutoffDate } });

    // 2. Purge inactive conversations older than 30 days
    const deletedConversations = await Conversation.deleteMany({
      lastMessageAt: { $lt: cutoffDate },
      createdAt: { $lt: cutoffDate }
    });

    if (deletedMessages.deletedCount > 0 || deletedConversations.deletedCount > 0) {
      console.log(`[Chat Auto-Cleanup] Purged ${deletedMessages.deletedCount} old messages & ${deletedConversations.deletedCount} conversations from MongoDB.`);
    }
  } catch (error) {
    console.error('[Chat Auto-Cleanup Error]:', error.message);
  }
}
