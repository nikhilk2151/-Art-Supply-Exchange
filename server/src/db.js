import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../.db_data');

let memoryServer;

const useInMemoryDb = process.env.USE_IN_MEMORY_DB?.toLowerCase() === 'true';

async function connectMemoryDatabase() {
  if (!memoryServer) {
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    } else {
      const lockFile = path.join(dbPath, 'mongod.lock');
      if (fs.existsSync(lockFile)) {
        try {
          const stats = fs.statSync(lockFile);
          if (stats.size === 0) {
            fs.unlinkSync(lockFile);
          }
        } catch (e) {
          // lock is held by active running process
        }
      }
    }
    console.log(`Starting persistent database server at ${dbPath}...`);
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        dbName: 'art-supply-exchange',
        storageEngine: 'wiredTiger'
      }
    });
  }

  const memoryUri = memoryServer.getUri('art-supply-exchange');

  await mongoose.connect(memoryUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });
  console.log(`MongoDB connected to persistent database at ${memoryUri} (Storage Path: ${dbPath})`);
  return mongoose.connection;
}

export async function connectDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const configuredUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/art-supply-exchange';
  const isAtlasCloud = configuredUri.startsWith('mongodb+srv://') || (!configuredUri.includes('127.0.0.1') && !configuredUri.includes('localhost'));
  
  console.log(`Database startup: isAtlas=${isAtlasCloud} useInMemory=${useInMemoryDb} NODE_ENV=${process.env.NODE_ENV || 'development'}`);

  if (useInMemoryDb) {
    return connectMemoryDatabase();
  }

  try {
    const timeoutMs = isAtlasCloud ? 15000 : 2000;
    await mongoose.connect(configuredUri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs
    });
    console.log(isAtlasCloud ? `☁️ MongoDB connected to MongoDB Atlas Cloud!` : `MongoDB connected to ${configuredUri}`);
    return mongoose.connection;
  } catch (error) {
    console.warn(`Failed to connect to MongoDB at ${configuredUri.split('@').pop()}: ${error.message}`);

    if (process.env.NODE_ENV === 'production' || isAtlasCloud) {
      if (isAtlasCloud) {
        console.error('🔴 MongoDB Atlas Connection Failure. Check your MONGO_URI, database user password, and Network Access (IP Whitelist 0.0.0.0/0) in MongoDB Atlas.');
      }
      throw error;
    }

    return connectMemoryDatabase();
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState >= 1) {
    await mongoose.disconnect();
  }

  if (memoryServer) {
    await memoryServer.stop({ doCleanup: false });
    memoryServer = null;
  }
}

process.on('SIGINT', async () => {
  try {
    await disconnectDatabase();
  } catch (err) {
    // ignore shutdown log
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    await disconnectDatabase();
  } catch (err) {
    // ignore shutdown log
  }
  process.exit(0);
});
