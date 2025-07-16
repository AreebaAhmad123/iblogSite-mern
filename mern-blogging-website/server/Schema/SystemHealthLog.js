import mongoose from 'mongoose';

const SystemHealthLogSchema = new mongoose.Schema({
  metric: {
    type: String,
    required: true,
    enum: ['cpu', 'memory', 'disk', 'network', 'response_time', 'error_rate', 'other'],
  },
  value: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['normal', 'warning', 'critical'],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SystemHealthLog', SystemHealthLogSchema); 