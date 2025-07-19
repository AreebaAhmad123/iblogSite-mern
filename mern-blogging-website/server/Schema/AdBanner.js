const mongoose = require('mongoose');

const AdBannerSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ''
  },
  visible: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AdBanner', AdBannerSchema); 