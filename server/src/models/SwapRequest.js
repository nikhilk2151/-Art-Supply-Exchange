import mongoose from 'mongoose';

const swapRequestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  message: String,
  status: { type: String, enum: ['pending','accepted','rejected','completed','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SwapRequest', swapRequestSchema);
