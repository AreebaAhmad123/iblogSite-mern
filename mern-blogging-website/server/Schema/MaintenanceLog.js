import mongoose from 'mongoose';

const MaintenanceLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['backup', 'migration', 'cleanup', 'other', 'newsletter'],
  },
  action: {
    type: String,
    required: false,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: false,
  },
  target: {
    type: String,
    required: false,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failure', 'in_progress'],
  },
  details: {
    type: String,
    required: false,
  },
  // Add these fields for DB maintenance logs
  optimizedIndexes: {
    type: Number,
    required: false,
  },
  cleanedRecords: {
    type: Object,
    required: false,
  },
  sizeReduction: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('MaintenanceLog', MaintenanceLogSchema); 