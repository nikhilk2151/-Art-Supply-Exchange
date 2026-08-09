import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: ['paint','brush','canvas','sketchbook','tool','other'], required: true },
  condition: { type: String, enum: ['new','like-new','used','worn'], required: true },
  price: { type: Number, default: 0 },
  listingType: { type: String, enum: ['sell','swap','both'], required: true },
  swapPreferences: String,
  images: { type: [String], default: [] },
  city: { type: String, required: true },
  state: { type: String, required: true },
  status: { type: String, enum: ['available','pending','sold','swapped'], default: 'available' },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

listingSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

export default mongoose.model('Listing', listingSchema);
