import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const DEMO_EMAILS = [
  'asha@example.com',
  'rohan@example.com',
  'meera@example.com',
  'karan@example.com',
  'nisha@example.com',
  'vikram@example.com',
  'admin@example.com'
];

async function getDemoUserIds() {
  const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select('_id');
  return demoUsers.map((u) => u._id);
}

router.get('/', protect, async (req, res) => {
  try {
    let participantQuery = { participants: req.user._id };

    if (req.user.role === 'admin') {
      const demoUserIds = await getDemoUserIds();
      participantQuery = {
        participants: { $in: [req.user._id, ...demoUserIds] }
      };
    }

    const conversations = await Conversation.find(participantQuery)
      .populate('participants', 'name email avatar city state')
      .populate('listing', 'title images price category condition')
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Failed to load conversations:', error);
    res.status(500).json({ message: 'Failed to load conversations' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { listingId, otherUserId } = req.body;
    let conversation = await Conversation.findOne({ participants: { $all: [req.user._id, otherUserId] }, listing: listingId })
      .populate('participants', 'name email avatar city state')
      .populate('listing', 'title images price category condition');

    if (!conversation) {
      conversation = await Conversation.create({ participants: [req.user._id, otherUserId], listing: listingId });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar city state')
        .populate('listing', 'title images price category condition');
    }

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start conversation' });
  }
});

router.get('/:id/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isAdmin = req.user.role === 'admin';
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && !isAdmin) {
      const demoUserIds = await getDemoUserIds();
      const hasDemoParticipant = conversation.participants.some((p) =>
        demoUserIds.some((dId) => dId.toString() === p.toString())
      );
      if (!hasDemoParticipant) {
        return res.status(403).json({ message: 'Not authorized to view these messages' });
      }
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load messages' });
  }
});

router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isAdmin = req.user.role === 'admin';
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant && !isAdmin) {
      const demoUserIds = await getDemoUserIds();
      const hasDemoParticipant = conversation.participants.some((p) =>
        demoUserIds.some((dId) => dId.toString() === p.toString())
      );
      if (!hasDemoParticipant) {
        return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
      }
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      text: text.trim()
    });

    await Conversation.findByIdAndUpdate(req.params.id, {
      lastMessage: text.trim(),
      lastMessageAt: new Date()
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
