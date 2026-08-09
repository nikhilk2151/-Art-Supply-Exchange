import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['buy','swap'], required: true },
  swapRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'SwapRequest' },
  status: { type: String, enum: ['pending','accepted','rejected','completed','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Transaction', transactionSchema);
