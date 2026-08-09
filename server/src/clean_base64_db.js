import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Listing from './models/Listing.js';
import { uploadImageToCloudinary } from './utils/cloudinary.js';

dotenv.config();

export async function cleanDatabaseBloat() {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return;
    }

    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/art-supply-exchange';
    if (mongoose.connection.readyState < 1) {
      await mongoose.connect(mongoUri);
    }

    const listings = await Listing.find({});
    let cleanedCount = 0;

    for (const listing of listings) {
      let updated = false;
      const cleanImages = [];

      for (const img of (listing.images || [])) {
        if (typeof img === 'string' && img.startsWith('data:image')) {
          const newUrl = await uploadImageToCloudinary(img);
          cleanImages.push(newUrl);
          updated = true;
        } else {
          cleanImages.push(img);
        }
      }

      if (updated) {
        listing.images = cleanImages;
        await listing.save();
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Database storage cleanup: purged Base64 strings from ${cleanedCount} listings.`);
    }
  } catch (err) {
    console.error('Database cleanup error:', err.message);
  }
}
