import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadImageToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

const createToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const ADMIN_EMAILS = [
  'artsupplyexchange2026@gmail.com',
  'nikhilk21518@gmail.com',
  'admin@example.com'
];

const checkAndApplyAdminRole = async (user) => {
  if (!user || !user.email) return user;
  const cleanEmail = user.email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(cleanEmail)) {
    if (user.role !== 'admin') {
      await User.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
      user.role = 'admin';
    }
  }
  return user;
};

// GET /api/auth/dummy-accounts - Fetch test accounts for easy testing & preview
router.get('/dummy-accounts', async (_req, res) => {
  try {
    const dummyEmails = [
      'admin@example.com',
      'artsupplyexchange2026@gmail.com',
      'asha@example.com',
      'rohan@example.com',
      'meera@example.com',
      'karan@example.com',
      'nisha@example.com',
      'vikram@example.com',
      'priya@example.com',
      'arjun@example.com'
    ];

    const users = await User.find({ email: { $in: dummyEmails } })
      .select('name email role city state avatar bio');

    const formatted = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      city: u.city,
      state: u.state,
      avatar: u.avatar,
      bio: u.bio,
      defaultPassword: 'password123'
    }));

    res.json({ accounts: formatted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dummy accounts', error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';
    const name = req.body.name || 'User';
    const city = req.body.city || 'Unknown';
    const state = req.body.state || 'Unknown';
    const avatar = req.body.avatar || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let existing = await User.findOne({ email });
    if (existing) {
      existing.password = await bcrypt.hash(password, 10);
      if (name && name !== 'User') existing.name = name;
      if (city && city !== 'Unknown') existing.city = city;
      if (state && state !== 'Unknown') existing.state = state;
      if (avatar) existing.avatar = avatar;
      await existing.save();

      await checkAndApplyAdminRole(existing);

      const token = createToken(existing);
      const safeUser = existing.toObject();
      delete safeUser.password;
      return res.status(200).json({ token, user: safeUser });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      city,
      state,
      avatar,
      isProfileCompleted: false,
      role: ADMIN_EMAILS.includes(email) ? 'admin' : 'user'
    });

    await checkAndApplyAdminRole(user);

    const token = createToken(user);
    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please register first.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      if (user.firebaseUid) {
        return res.status(401).json({ message: 'Invalid password. If you signed up via Google, please use "Continue with Google" or click Register to set a password.' });
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await checkAndApplyAdminRole(user);
    const updatedUser = await User.findById(user._id);

    const token = createToken(updatedUser);
    const safeUser = updatedUser.toObject();
    delete safeUser.password;
    if (safeUser.isProfileCompleted === undefined) {
      safeUser.isProfileCompleted = true;
    }
    res.json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase();
    const name = req.body.name || email.split('@')[0];
    const firebaseUid = req.body.firebaseUid || '';
    const city = req.body.city || 'Unknown';
    const state = req.body.state || 'Unknown';
    const avatar = req.body.avatar || '';

    if (!email || !firebaseUid) {
      return res.status(400).json({ message: 'Email and Firebase user ID are required' });
    }

    const isAdminEmail = ADMIN_EMAILS.includes(email.trim());
    const roleToAssign = isAdminEmail ? 'admin' : 'user';

    let user = await User.findOne({ email });
    let isNew = false;
    if (!user) {
      isNew = true;
      const randomPassword = Math.random().toString(36).slice(-16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        firebaseUid,
        city,
        state,
        avatar,
        isProfileCompleted: false,
        role: roleToAssign
      });
    } else {
      user.role = roleToAssign;
      if (!user.firebaseUid) user.firebaseUid = firebaseUid;
      if (avatar && !user.avatar) user.avatar = avatar;
      if (user.isProfileCompleted === undefined) {
        user.isProfileCompleted = true;
      }
      await user.save();
    }

    const token = createToken(user);
    const safeUser = user.toObject();
    delete safeUser.password;
    if (safeUser.isProfileCompleted === undefined) {
      safeUser.isProfileCompleted = !isNew;
    }
    res.json({ token, user: safeUser, isNewUser: isNew });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  const safeUser = req.user.toObject ? req.user.toObject() : { ...req.user };
  if (safeUser.isProfileCompleted === undefined) {
    safeUser.isProfileCompleted = true;
  }
  res.json({ user: safeUser });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.email;
    delete updates.password;

    updates.isProfileCompleted = true;

    if (updates.avatar && typeof updates.avatar === 'string' && updates.avatar.startsWith('data:image')) {
      const uploadedUrl = await uploadImageToCloudinary(updates.avatar);
      if (uploadedUrl) {
        updates.avatar = uploadedUrl;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: 'after' }).select('-password');
    const safeUser = user.toObject();
    safeUser.isProfileCompleted = true;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
});

export default router;

