const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'User' },
  // Security: Storage calculation is folder-independent
  // Storage is calculated based on total file sizes owned by user,
  // regardless of folder structure (Requirement 10.3)
  storageUsed: { type: Number, default: 0 }, // In bytes
  storageLimit: { type: Number, default: 262144000 } // 250MB in bytes
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);