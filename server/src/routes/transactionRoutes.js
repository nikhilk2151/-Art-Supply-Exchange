import express from 'express';
import Transaction from '../models/Transaction.js';
import Listing from '../models/Listing.js';
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

router.post('/', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.body.listing).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot buy your own listing' });
    }

    let transaction = await Transaction.findOne({
      listing: listing._id,
      buyer: req.user._id,
      status: 'pending'
    }).populate('listing').populate('buyer', 'name email city state').populate('seller', 'name email city state');

    if (!transaction) {
      transaction = await Transaction.create({
        listing: listing._id,
        buyer: req.user._id,
        seller: listing.seller._id,
        type: 'buy',
        status: 'pending'
      });
      transaction = await Transaction.findById(transaction._id)
        .populate('listing')
        .populate('buyer', 'name email city state')
        .populate('seller', 'name email city state');
    }

    // Auto-create chat conversation between Buyer and Seller
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, listing.seller._id] },
      listing: listing._id
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, listing.seller._id],
        listing: listing._id
      });
    }

    // Send automatic chat notification message
    const buyMessage = `🛒 BUY REQUEST: Hi ${listing.seller.name}! I would like to buy your listing "${listing.title}" for ₹${listing.price}. Please let me know how to proceed with payment/pickup.`;

    const messageDoc = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: buyMessage
    });

    conversation.lastMessage = messageDoc.text;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    res.status(201).json({ transaction, conversationId: conversation._id });
  } catch (error) {
    console.error('Transaction creation failed:', error);
    res.status(500).json({ message: 'Failed to create buy request', error: error.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
      .populate('listing')
      .populate('buyer', 'name email city state')
      .populate('seller', 'name email city state')
      .sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load transactions' });
  }
});

router.get('/sent', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyer: req.user._id })
      .populate('listing')
      .populate('seller', 'name email city state')
      .sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sent transactions' });
  }
});

router.get('/received', protect, async (req, res) => {
  try {
    let sellerFilter = { seller: req.user._id };

    if (req.user.role === 'admin') {
      const demoUserIds = await getDemoUserIds();
      sellerFilter = { seller: { $in: [req.user._id, ...demoUserIds] } };
    }

    const transactions = await Transaction.find(sellerFilter)
      .populate('listing')
      .populate('buyer', 'name email city state')
      .populate('seller', 'name email city state')
      .sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load received transactions' });
  }
});

async function sendChatUpdate(listingId, buyerId, sellerId, senderId, text) {
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [buyerId, sellerId] },
      listing: listingId
    });
    if (conversation) {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        text
      });
      conversation.lastMessage = msg.text;
      conversation.lastMessageAt = Date.now();
      await conversation.save();
    }
  } catch (err) {
    console.error('Failed to post status chat update:', err);
  }
}

router.patch('/:id/accept', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('listing');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isAdmin = req.user.role === 'admin';
    const sellerId = transaction.seller?._id || transaction.seller;
    const isSeller = sellerId && sellerId.toString() === req.user._id.toString();

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Only seller or Admin can accept purchase requests' });
    }

    transaction.status = 'accepted';
    await transaction.save();

    // Notify buyer via chat if conversation exists
    if (transaction.listing && transaction.buyer) {
      await sendChatUpdate(
        transaction.listing._id || transaction.listing,
        transaction.buyer,
        sellerId,
        req.user._id,
        `✅ REQUEST ACCEPTED: Seller ${req.user.name || 'Seller'} accepted your purchase request for "${transaction.listing.title || 'the item'}".`
      );
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Accept transaction failed:', error);
    res.status(500).json({ message: 'Failed to accept purchase request', error: error.message });
  }
});

const handleRejectOrDeclineTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('listing');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isAdmin = req.user.role === 'admin';
    const sellerId = transaction.seller?._id || transaction.seller;
    const isSeller = sellerId && sellerId.toString() === req.user._id.toString();

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Only seller or Admin can decline purchase requests' });
    }

    transaction.status = 'rejected';
    await transaction.save();

    // Notify buyer via chat if conversation exists
    if (transaction.listing && transaction.buyer) {
      await sendChatUpdate(
        transaction.listing._id || transaction.listing,
        transaction.buyer,
        sellerId,
        req.user._id,
        `❌ REQUEST DECLINED: Seller ${req.user.name || 'Seller'} declined your purchase request for "${transaction.listing.title || 'the item'}".`
      );
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Decline transaction failed:', error);
    res.status(500).json({ message: 'Failed to decline purchase request', error: error.message });
  }
};

router.patch('/:id/reject', protect, handleRejectOrDeclineTransaction);
router.patch('/:id/decline', protect, handleRejectOrDeclineTransaction);

router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('listing');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isAdmin = req.user.role === 'admin';
    const sellerId = transaction.seller?._id || transaction.seller;
    const isSeller = sellerId && sellerId.toString() === req.user._id.toString();

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Only seller or Admin can complete' });
    }

    transaction.status = 'completed';
    await transaction.save();

    const listingId = transaction.listing?._id || transaction.listing;
    const listing = await Listing.findById(listingId);
    if (listing) {
      listing.status = 'sold';
      await listing.save();
    }

    // Notify buyer via chat if conversation exists
    if (transaction.listing && transaction.buyer) {
      await sendChatUpdate(
        listingId,
        transaction.buyer,
        sellerId,
        req.user._id,
        `🎉 TRANSACTION COMPLETED: Seller ${req.user.name || 'Seller'} marked "${listing?.title || 'the item'}" as sold and completed.`
      );
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Complete transaction failed:', error);
    res.status(500).json({ message: 'Failed to complete transaction', error: error.message });
  }
});

export default router;
