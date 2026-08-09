import express from 'express';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Report from '../models/Report.js';
import Transaction from '../models/Transaction.js';
import SwapRequest from '../models/SwapRequest.js';
import { deleteCloudinaryImage } from '../utils/cloudinary.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', async (_req, res) => {
  try {
    const [totalListings, totalTransactions, activeUsers] = await Promise.all([
      Listing.countDocuments(),
      Transaction.countDocuments(),
      User.countDocuments({ isBanned: false })
    ]);

    const conversionRate = totalListings ? (totalTransactions / totalListings * 100).toFixed(1) : 0;
    res.json({ stats: { totalListings, totalTransactions, activeUsers, conversionRate } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load admin stats' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load users' });
  }
});

router.patch('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user ban status' });
  }
});

router.get('/listings', async (_req, res) => {
  try {
    const listings = await Listing.find().populate('seller', 'name').sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load listings' });
  }
});

router.delete('/listings/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (Array.isArray(listing.images)) {
      for (const imgUrl of listing.images) {
        await deleteCloudinaryImage(imgUrl);
      }
    }

    await Listing.findByIdAndDelete(req.params.id);
    await SwapRequest.deleteMany({ listing: req.params.id });
    await Transaction.deleteMany({ listing: req.params.id });

    res.json({ message: 'Listing and images permanently deleted from database and storage' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete listing', error: error.message });
  }
});

router.get('/reports', async (_req, res) => {
  try {
    const reports = await Report.find().populate('reporter').populate('reportedUser').populate('reportedListing').sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load reports' });
  }
});

router.patch('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = req.body.status || report.status;
    report.adminNotes = req.body.adminNotes || report.adminNotes;
    await report.save();
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update report' });
  }
});

export default router;
