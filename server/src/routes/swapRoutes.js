import express from 'express';
import { body, validationResult } from 'express-validator';
import SwapRequest from '../models/SwapRequest.js';
import Listing from '../models/Listing.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
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

async function sendSwapChatUpdate(listingId, requesterId, sellerId, senderId, text) {
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [requesterId, sellerId] },
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
    console.error('Failed to post swap status chat update:', err);
  }
}

router.post('/', protect, [
  body('listing').notEmpty().withMessage('Listing is required'),
  body('message').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const listing = await Listing.findById(req.body.listing);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() === req.user._id.toString()) return res.status(400).json({ message: 'You cannot swap with your own listing' });

    const swap = await SwapRequest.create({
      ...req.body,
      requester: req.user._id
    });
    res.status(201).json({ swap });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create swap request' });
  }
});

router.get('/sent', protect, async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ requester: req.user._id })
      .populate({ path: 'listing', populate: { path: 'seller', select: 'name city state' } })
      .populate('offeredListing');
    res.json({ swaps });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load sent swaps' });
  }
});

router.get('/received', protect, async (req, res) => {
  try {
    let sellerFilter = { seller: req.user._id };
    if (req.user.role === 'admin') {
      const demoUserIds = await getDemoUserIds();
      sellerFilter = { seller: { $in: [req.user._id, ...demoUserIds] } };
    }

    const targetListingIds = await Listing.find(sellerFilter).distinct('_id');
    const swaps = await SwapRequest.find({ listing: { $in: targetListingIds } })
      .populate({ path: 'listing', populate: { path: 'seller', select: 'name email city state' } })
      .populate('requester', 'name email city state avatar')
      .populate('offeredListing');
    res.json({ swaps });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load received swaps' });
  }
});

router.patch('/:id/accept', protect, async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id).populate('listing');
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const isAdmin = req.user.role === 'admin';
    const sellerId = swap.listing?.seller?._id || swap.listing?.seller;
    const isOwner = sellerId && sellerId.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the listing owner or Admin can accept' });
    }

    swap.status = 'accepted';
    await swap.save();

    if (swap.listing && swap.requester) {
      await sendSwapChatUpdate(
        swap.listing._id || swap.listing,
        swap.requester,
        sellerId,
        req.user._id,
        `✅ SWAP ACCEPTED: Seller ${req.user.name || 'Seller'} accepted your swap offer for "${swap.listing.title || 'the item'}".`
      );
    }

    res.json({ swap });
  } catch (error) {
    console.error('Accept swap failed:', error);
    res.status(500).json({ message: 'Failed to accept swap', error: error.message });
  }
});

const handleRejectOrDeclineSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id).populate('listing');
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const isAdmin = req.user.role === 'admin';
    const sellerId = swap.listing?.seller?._id || swap.listing?.seller;
    const isOwner = sellerId && sellerId.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the listing owner or Admin can reject' });
    }

    swap.status = 'rejected';
    await swap.save();

    if (swap.listing && swap.requester) {
      await sendSwapChatUpdate(
        swap.listing._id || swap.listing,
        swap.requester,
        sellerId,
        req.user._id,
        `❌ SWAP DECLINED: Seller ${req.user.name || 'Seller'} declined your swap offer for "${swap.listing.title || 'the item'}".`
      );
    }

    res.json({ swap });
  } catch (error) {
    console.error('Decline swap failed:', error);
    res.status(500).json({ message: 'Failed to reject swap', error: error.message });
  }
};

router.patch('/:id/reject', protect, handleRejectOrDeclineSwap);
router.patch('/:id/decline', protect, handleRejectOrDeclineSwap);

router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id).populate('listing');
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    const isAdmin = req.user.role === 'admin';
    const sellerId = swap.listing?.seller?._id || swap.listing?.seller;
    const isOwner = sellerId && sellerId.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the listing owner or Admin can complete' });
    }

    swap.status = 'completed';
    await swap.save();

    if (swap.listing) {
      const listing = await Listing.findById(swap.listing._id || swap.listing);
      if (listing) {
        listing.status = 'swapped';
        await listing.save();
      }
    }

    if (swap.listing && swap.requester) {
      await sendSwapChatUpdate(
        swap.listing._id || swap.listing,
        swap.requester,
        sellerId,
        req.user._id,
        `🎉 SWAP COMPLETED: Seller ${req.user.name || 'Seller'} marked "${swap.listing.title || 'the item'}" swap as completed.`
      );
    }

    res.json({ swap });
  } catch (error) {
    console.error('Complete swap failed:', error);
    res.status(500).json({ message: 'Failed to complete swap', error: error.message });
  }
});

export default router;
