const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        // Reject empty strings and whitespace-only strings
        return v && v.trim().length > 0;
      },
      message: 'Folder name cannot be empty or contain only whitespace'
    }
  },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  isStarred: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  sharedWith: [{ type: String }], // Array of emails the folder is shared with
  lastAccessed: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient folder queries
FolderSchema.index({ user: 1, parentFolder: 1, isDeleted: 1 }); // Query folders by user and parent
FolderSchema.index({ user: 1, isStarred: 1, isDeleted: 1 }); // Query starred folders
FolderSchema.index({ user: 1, isDeleted: 1, deletedAt: -1 }); // Query deleted folders

// Helper method to calculate item count (files + subfolders, excluding deleted)
FolderSchema.methods.getItemCount = async function() {
  const File = require('./File');
  
  // Count non-deleted subfolders
  const folderCount = await mongoose.model('Folder').countDocuments({
    parentFolder: this._id,
    isDeleted: false
  });
  
  // Count non-deleted files
  const fileCount = await File.countDocuments({
    parentFolder: this._id,
    isDeleted: false
  });
  
  return folderCount + fileCount;
};

module.exports = mongoose.model('Folder', FolderSchema);
