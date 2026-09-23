import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import swapRoutes from './routes/swapRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { connectDatabase } from './db.js';
import User from './models/User.js';
import Listing from './models/Listing.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import { runSeed } from './seed.js';
import { cleanDatabaseBloat } from './clean_base64_db.js';
import { autoCleanupOldChats } from './clean_chats.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

// Serve static client assets for single-platform deployment
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  next();
});

io.on('connection', (socket) => {
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('send_message', (payload) => {
    socket.to(payload.conversation).emit('receive_message', payload);
  });

  socket.on('typing', (payload) => {
    socket.to(payload.conversation).emit('typing', payload);
  });

  socket.on('stop_typing', (payload) => {
    socket.to(payload.conversation).emit('stop_typing', payload);
  });
});

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(async () => {
    // Ensure dummy accounts and test data are verified and available on startup
    await runSeed();
    const userCount = await User.countDocuments();
    const listingCount = await Listing.countDocuments();
    console.log(`Loaded database (${userCount} users, ${listingCount} listings).`);
    await cleanDatabaseBloat();

    // Automated 48-Hour Chat Purge
    await autoCleanupOldChats();
    setInterval(autoCleanupOldChats, 10 * 60 * 1000);

    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
