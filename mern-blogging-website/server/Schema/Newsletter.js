import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  unsubscribeToken: {
    type: String
  },
  bounceCount: {
    type: Number,
    default: 0
  }
});

export default mongoose.model('Newsletter', newsletterSchema); 