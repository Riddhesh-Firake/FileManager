const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String },
  b2FileId: { type: String, required: true },
  b2FileName: { type: String, required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  isStarred: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  sharedWith: [{ type: String }], // Array of emails the file is shared with
  lastAccessed: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient file queries
FileSchema.index({ user: 1, parentFolder: 1, isDeleted: 1 }); // Query files by folder

module.exports = mongoose.model('File', FileSchema);