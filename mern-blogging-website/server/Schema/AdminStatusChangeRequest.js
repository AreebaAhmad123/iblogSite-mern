import mongoose from 'mongoose';

const AdminStatusChangeRequestSchema = new mongoose.Schema({
  requestingUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  action: {
    type: String,
    enum: ['promote', 'demote'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  reviewedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('AdminStatusChangeRequest', AdminStatusChangeRequestSchema); 