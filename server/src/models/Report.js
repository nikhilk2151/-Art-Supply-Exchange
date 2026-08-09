import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open','reviewing','resolved'], default: 'open' },
  adminNotes: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Report', reportSchema);
