import express from 'express';
import { body, validationResult } from 'express-validator';
import Listing from '../models/Listing.js';
import SwapRequest from '../models/SwapRequest.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/authMiddleware.js';
import { deleteCloudinaryImage, uploadImageToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, condition, city, minPrice, maxPrice, listingType, sort = 'newest', page = 1 } = req.query;
    const filter = { status: { $ne: 'sold' } };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (listingType) filter.listingType = listingType;

    const sortMap = {
      newest: { createdAt: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 }
    };

    const pageNumber = Number(page) || 1;
    const limit = 9;
    const [items, total] = await Promise.all([
      Listing.find(filter).sort(sortMap[sort] || sortMap.newest).skip((pageNumber - 1) * limit).limit(limit).populate('seller', 'name email city state avatar'),
      Listing.countDocuments(filter)
    ]);

    res.json({ items, total, page: pageNumber, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { seller: req.user._id };
    const items = await Listing.find(filter).sort({ createdAt: -1 }).populate('seller', 'name email city state avatar');
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const items = await Listing.find({ seller: req.params.userId, status: { $ne: 'sold' } }).sort({ createdAt: -1 }).populate('seller', 'name email city state avatar');
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user listings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { returnDocument: 'after' }).populate('seller', 'name email city state avatar bio');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listing' });
  }
});

const DEMO_EMAILS = [
  'asha@example.com',
  'rohan@example.com',
  'meera@example.com',
  'karan@example.com',
  'nisha@example.com',
  'vikram@example.com',
  'admin@example.com'
];

const isDemoUser = (user) => {
  if (!user || !user.email) return false;
  return DEMO_EMAILS.includes(user.email.toLowerCase().trim());
};

router.post('/', protect, async (req, res) => {
  try {
    if (isDemoUser(req.user)) {
      return res.status(403).json({ message: 'Demo accounts are read-only. Please log in with your Google account (e.g. artsupplyexchange2026@gmail.com) to publish listings.' });
    }

    const rawImages = Array.isArray(req.body.images)
      ? req.body.images.filter(Boolean)
      : (req.body.images ? [req.body.images] : []);

    const uploadedImages = await Promise.all(
      rawImages.map((img) => uploadImageToCloudinary(img))
    );

    const payload = {
      title: req.body.title || 'Untitled listing',
      description: req.body.description || 'No description provided.',
      category: req.body.category || 'other',
      condition: req.body.condition || 'used',
      price: Number(req.body.price) || 0,
      listingType: req.body.listingType || 'sell',
      swapPreferences: req.body.swapPreferences || '',
      city: req.body.city || req.user.city || 'Unknown',
      state: req.body.state || req.user.state || 'Unknown',
      seller: req.user._id,
      images: uploadedImages.filter(Boolean)
    };

    const listing = await Listing.create(payload);
    res.status(201).json({ listing });
  } catch (error) {
    console.error('Listing creation failed:', error);
    const validationMessage = error.errors ? Object.values(error.errors).map((err) => err.message).join(', ') : error.message;
    res.status(500).json({ message: 'Failed to create listing', error: validationMessage });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = listing.seller?._id?.toString() === req.user._id.toString() || listing.seller?.toString() === req.user._id.toString();
    const isDemo = isDemoUser(req.user) || (listing.seller && isDemoUser(listing.seller));

    if (isDemo && !isAdmin) {
      return res.status(403).json({ message: 'Demo account listings can only be managed by the Admin account (artsupplyexchange2026@gmail.com).' });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this listing' });
    }

    const updateBody = { ...req.body };
    if (updateBody.images && Array.isArray(updateBody.images)) {
      updateBody.images = (await Promise.all(
        updateBody.images.filter(Boolean).map((img) => uploadImageToCloudinary(img))
      )).filter(Boolean);
    }

    const updated = await Listing.findByIdAndUpdate(req.params.id, updateBody, { returnDocument: 'after' }).populate('seller', 'name email city state avatar bio');
    res.json({ listing: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update listing', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = listing.seller?._id?.toString() === req.user._id.toString() || listing.seller?.toString() === req.user._id.toString();
    const isDemo = isDemoUser(req.user) || (listing.seller && isDemoUser(listing.seller));

    if (isDemo && !isAdmin) {
      return res.status(403).json({ message: 'Demo account listings can only be managed by the Admin account (artsupplyexchange2026@gmail.com).' });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    // Delete image files from Cloudinary storage if applicable
    if (Array.isArray(listing.images)) {
      for (const imgUrl of listing.images) {
        await deleteCloudinaryImage(imgUrl);
      }
    }

    // Remove listing document from MongoDB database
    await Listing.findByIdAndDelete(req.params.id);

    // Delete associated swap requests and transactions
    await SwapRequest.deleteMany({ listing: req.params.id });
    await Transaction.deleteMany({ listing: req.params.id });

    res.json({ message: 'Listing and images permanently deleted from database and storage' });
  } catch (error) {
    console.error('Failed to delete listing:', error);
    res.status(500).json({ message: 'Failed to delete listing', error: error.message });
  }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = listing.seller?._id?.toString() === req.user._id.toString() || listing.seller?.toString() === req.user._id.toString();
    const isDemo = isDemoUser(req.user) || (listing.seller && isDemoUser(listing.seller));

    if (isDemo && !isAdmin) {
      return res.status(403).json({ message: 'Demo account listings can only be managed by the Admin account (artsupplyexchange2026@gmail.com).' });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    listing.status = req.body.status;
    await listing.save();
    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

export default router;
