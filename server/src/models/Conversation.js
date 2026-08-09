import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  lastMessage: String,
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, expires: 172800 } // Automatically expires and deletes from MongoDB after 48 hours (172800 seconds)
});

export default mongoose.model('Conversation', conversationSchema);
