import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  explanation: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Contact', ContactSchema); 