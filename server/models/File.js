const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String },
  b2FileId: { type: String, required: true },
  b2FileName: { type: String, required: true },
  isStarred: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  sharedWith: [{ type: String }] // Array of emails the file is shared with
}, { timestamps: true });

module.exports = mongoose.model('File', FileSchema);