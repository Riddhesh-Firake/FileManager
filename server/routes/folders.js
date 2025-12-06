const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Folder = require('../models/Folder');
const File = require('../models/File');
const User = require('../models/User');

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

// Security: Validate MongoDB ObjectId to prevent path traversal and injection attacks
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Security: Sanitize folder name to prevent injection and ensure valid characters
const sanitizeFolderName = (name) => {
  if (!name || typeof name !== 'string') {
    return null;
  }
  
  // Remove leading/trailing whitespace
  const trimmed = name.trim();
  
  // Check if empty after trimming
  if (trimmed.length === 0) {
    return null;
  }
  
  // Remove any null bytes or control characters that could cause issues
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Prevent path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
    return null;
  }
  
  // Limit length to prevent abuse
  if (sanitized.length > 255) {
    return null;
  }
  
  return sanitized;
};

// Helper function to check if folder name is valid
const isValidFolderName = (name) => {
  return sanitizeFolderName(name) !== null;
};

// Helper function to get all folder descendants (for recursive operations)
const getAllDescendants = async (folderId) => {
  const descendants = [];
  const queue = [folderId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    descendants.push(currentId);
    
    // Find all child folders
    const childFolders = await Folder.find({ parentFolder: currentId });
    queue.push(...childFolders.map(f => f._id));
  }
  
  return descendants;
};

// Security: Validate folder ownership
const validateFolderOwnership = async (folderId, userId) => {
  if (!isValidObjectId(folderId)) {
    return { valid: false, error: 'Invalid folder ID format' };
  }
  
  const folder = await Folder.findById(folderId);
  
  if (!folder) {
    return { valid: false, error: 'Folder not found' };
  }
  
  if (folder.user.toString() !== userId) {
    return { valid: false, error: "You don't have permission to access this folder" };
  }
  
  return { valid: true, folder };
};

// --- ROUTES ---

// 1. Create Folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    
    // Security: Sanitize and validate folder name
    const sanitizedName = sanitizeFolderName(name);
    if (!sanitizedName) {
      return res.status(400).json({ msg: 'Folder name cannot be empty or contain invalid characters' });
    }
    
    // Security: Validate parent folder ID format if provided
    if (parentFolder && !isValidObjectId(parentFolder)) {
      return res.status(400).json({ msg: 'Invalid parent folder ID format' });
    }
    
    // Check for duplicate folder name in same parent
    const existingFolder = await Folder.findOne({
      user: req.user.id,
      name: sanitizedName,
      parentFolder: parentFolder || null,
      isDeleted: false
    });
    
    if (existingFolder) {
      return res.status(409).json({ msg: 'A folder with this name already exists in this location' });
    }
    
    // Security: If parentFolder is specified, verify it exists and user owns it
    if (parentFolder) {
      const validation = await validateFolderOwnership(parentFolder, req.user.id);
      if (!validation.valid) {
        return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error });
      }
    }
    
    // Create new folder
    const newFolder = new Folder({
      user: req.user.id,
      name: sanitizedName,
      parentFolder: parentFolder || null
    });
    
    await newFolder.save();
    
    // Add item count (will be 0 for new folder)
    const itemCount = await newFolder.getItemCount();
    const folderWithCount = {
      ...newFolder.toObject(),
      itemCount
    };
    
    res.json(folderWithCount);
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Folders (with optional parent filter)
router.get('/', auth, async (req, res) => {
  try {
    const { parentFolder } = req.query;
    
    const query = {
      user: req.user.id
    };
    
    // Filter by parent if specified
    if (parentFolder !== undefined) {
      query.parentFolder = parentFolder === 'null' || parentFolder === '' ? null : parentFolder;
    }
    
    const folders = await Folder.find(query).sort({ createdAt: -1 });
    
    // Add item counts to each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const itemCount = await folder.getItemCount();
        return {
          ...folder.toObject(),
          itemCount
        };
      })
    );
    
    res.json(foldersWithCounts);
  } catch (err) {
    console.error('Get folders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2b. Get Folders Shared WITH Me (must be before /:id route)
router.get('/shared', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Find folders where sharedWith array contains user's email
    const folders = await Folder.find({ 
      sharedWith: user.email, 
      isDeleted: false 
    })
      .populate('user', 'name email') // Get owner info
      .sort({ createdAt: -1 });
    
    // Add item counts to each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const itemCount = await folder.getItemCount();
        return {
          ...folder.toObject(),
          itemCount
        };
      })
    );
    
    res.json(foldersWithCounts);
  } catch (err) {
    console.error('Get shared folders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2c. Get Recent Folders (must be before /:id route)
router.get('/recent', auth, async (req, res) => {
  try {
    // Find user's folders sorted by lastAccessed, limit to 10 most recent
    const folders = await Folder.find({ 
      user: req.user.id,
      isDeleted: false 
    })
      .sort({ lastAccessed: -1 })
      .limit(10);
    
    // Add item counts to each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const itemCount = await folder.getItemCount();
        return {
          ...folder.toObject(),
          itemCount
        };
      })
    );
    
    res.json(foldersWithCounts);
  } catch (err) {
    console.error('Get recent folders error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Folder by ID
router.get('/:id', auth, async (req, res) => {
  try {
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }
    
    // Security: Check ownership or shared access
    const user = await User.findById(req.user.id);
    const isOwner = folder.user.toString() === req.user.id;
    const isShared = folder.sharedWith.includes(user.email);
    
    if (!isOwner && !isShared) {
      return res.status(403).json({ msg: "You don't have permission to access this folder" });
    }
    
    // Update lastAccessed timestamp
    folder.lastAccessed = new Date();
    await folder.save();
    
    // Add item count
    const itemCount = await folder.getItemCount();
    const folderWithCount = {
      ...folder.toObject(),
      itemCount
    };
    
    res.json(folderWithCount);
  } catch (err) {
    console.error('Get folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Folder Contents (files + subfolders)
router.get('/:id/contents', auth, async (req, res) => {
  try {
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ msg: 'Folder not found' });
    }
    
    // Security: Check ownership or shared access
    const user = await User.findById(req.user.id);
    const isOwner = folder.user.toString() === req.user.id;
    const isShared = folder.sharedWith.includes(user.email);
    
    if (!isOwner && !isShared) {
      return res.status(403).json({ msg: "You don't have permission to access this folder" });
    }
    
    // Update lastAccessed timestamp
    folder.lastAccessed = new Date();
    await folder.save();
    
    // Get subfolders
    const subfolders = await Folder.find({
      parentFolder: req.params.id,
      isDeleted: false
    }).sort({ name: 1 });
    
    // Add item counts to each subfolder
    const subfoldersWithCounts = await Promise.all(
      subfolders.map(async (subfolder) => {
        const itemCount = await subfolder.getItemCount();
        return {
          ...subfolder.toObject(),
          itemCount
        };
      })
    );
    
    // Get files
    const files = await File.find({
      parentFolder: req.params.id,
      isDeleted: false
    }).sort({ fileName: 1 });
    
    res.json({ folders: subfoldersWithCounts, files });
  } catch (err) {
    console.error('Get folder contents error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Rename Folder
router.put('/:id', auth, async (req, res) => {
  try {
    const { newName } = req.body;
    
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    // Security: Sanitize and validate folder name
    const sanitizedName = sanitizeFolderName(newName);
    if (!sanitizedName) {
      return res.status(400).json({ msg: 'Folder name cannot be empty or contain invalid characters' });
    }
    
    // Security: Validate folder ownership
    const validation = await validateFolderOwnership(req.params.id, req.user.id);
    if (!validation.valid) {
      return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error });
    }
    
    const folder = validation.folder;
    
    // Check for duplicate folder name in same parent
    const existingFolder = await Folder.findOne({
      user: req.user.id,
      name: sanitizedName,
      parentFolder: folder.parentFolder,
      isDeleted: false,
      _id: { $ne: req.params.id } // Exclude current folder
    });
    
    if (existingFolder) {
      return res.status(409).json({ msg: 'A folder with this name already exists in this location' });
    }
    
    folder.name = sanitizedName;
    await folder.save();
    
    // Add item count
    const itemCount = await folder.getItemCount();
    const folderWithCount = {
      ...folder.toObject(),
      itemCount
    };
    
    res.json(folderWithCount);
  } catch (err) {
    console.error('Rename folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Move Folder
router.put('/:id/move', auth, async (req, res) => {
  try {
    const { destinationFolderId } = req.body;
    
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    // Security: Validate destination folder ID format if provided
    if (destinationFolderId && !isValidObjectId(destinationFolderId)) {
      return res.status(400).json({ msg: 'Invalid destination folder ID format' });
    }
    
    // Security: Validate folder ownership
    const validation = await validateFolderOwnership(req.params.id, req.user.id);
    if (!validation.valid) {
      return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error });
    }
    
    const folder = validation.folder;
    
    // Security: If moving to a specific folder (not root), validate destination ownership
    if (destinationFolderId) {
      const destValidation = await validateFolderOwnership(destinationFolderId, req.user.id);
      if (!destValidation.valid) {
        return res.status(destValidation.error === 'Folder not found' ? 404 : 403).json({ msg: 'Destination ' + destValidation.error.toLowerCase() });
      }
      
      // Security: Check for circular reference (moving folder into itself or its descendants)
      const descendants = await getAllDescendants(req.params.id);
      if (descendants.some(id => id.toString() === destinationFolderId)) {
        return res.status(400).json({ msg: 'Cannot move folder into itself or its descendants' });
      }
    }
    
    // Check for duplicate folder name in destination
    const existingFolder = await Folder.findOne({
      user: req.user.id,
      name: folder.name,
      parentFolder: destinationFolderId || null,
      isDeleted: false,
      _id: { $ne: req.params.id }
    });
    
    if (existingFolder) {
      return res.status(409).json({ msg: 'A folder with this name already exists in the destination' });
    }
    
    folder.parentFolder = destinationFolderId || null;
    await folder.save();
    
    // Add item count
    const itemCount = await folder.getItemCount();
    const folderWithCount = {
      ...folder.toObject(),
      itemCount
    };
    
    res.json(folderWithCount);
  } catch (err) {
    console.error('Move folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Share Folder
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }
    
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    // Security: Validate folder ownership
    const validation = await validateFolderOwnership(req.params.id, req.user.id);
    if (!validation.valid) {
      return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error === 'Folder not found' ? validation.error : 'Only owner can share folders' });
    }
    
    const folder = validation.folder;
    
    if (!folder.sharedWith.includes(email)) {
      folder.sharedWith.push(email);
      await folder.save();
    }
    
    // Add item count
    const itemCount = await folder.getItemCount();
    const folderWithCount = {
      ...folder.toObject(),
      itemCount
    };
    
    res.json({ msg: 'Folder shared successfully', folder: folderWithCount });
  } catch (err) {
    console.error('Share folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Toggle Star
router.put('/:id/star', auth, async (req, res) => {
  try {
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    // Security: Validate folder ownership
    const validation = await validateFolderOwnership(req.params.id, req.user.id);
    if (!validation.valid) {
      return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error === 'Folder not found' ? validation.error : 'Only owner can star folders' });
    }
    
    const folder = validation.folder;
    
    folder.isStarred = !folder.isStarred;
    await folder.save();
    
    // Add item count
    const itemCount = await folder.getItemCount();
    const folderWithCount = {
      ...folder.toObject(),
      itemCount
    };
    
    res.json(folderWithCount);
  } catch (err) {
    console.error('Toggle star error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Soft Delete Folder (recursive)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    // Security: Validate folder ownership
    const validation = await validateFolderOwnership(req.params.id, req.user.id);
    if (!validation.valid) {
      return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error });
    }
    
    const folder = validation.folder;
    
    // Security: Check if folder has contents - require soft delete (prevent hard delete)
    const hasSubfolders = await Folder.countDocuments({ parentFolder: req.params.id, isDeleted: false });
    const hasFiles = await File.countDocuments({ parentFolder: req.params.id, isDeleted: false });
    
    if (hasSubfolders > 0 || hasFiles > 0) {
      // Folder has contents, proceed with soft delete (this is the only allowed operation)
      const deletedAt = new Date();
      
      // Get all descendant folders
      const descendantIds = await getAllDescendants(req.params.id);
      
      // Soft delete all descendant folders
      await Folder.updateMany(
        { _id: { $in: descendantIds } },
        { 
          $set: { 
            isDeleted: true, 
            deletedAt: deletedAt 
          } 
        }
      );
      
      // Soft delete all files in these folders
      await File.updateMany(
        { parentFolder: { $in: descendantIds } },
        { 
          $set: { 
            isDeleted: true, 
            deletedAt: deletedAt 
          } 
        }
      );
      
      res.json({ msg: 'Folder moved to trash' });
    } else {
      // Empty folder, still use soft delete for consistency
      folder.isDeleted = true;
      folder.deletedAt = new Date();
      await folder.save();
      
      res.json({ msg: 'Folder moved to trash' });
    }
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Restore Folder (recursive)
router.put('/:id/restore', auth, async (req, res) => {
  try {
    // Security: Validate folder ID format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid folder ID format' });
    }
    
    // Security: Validate folder ownership
    const validation = await validateFolderOwnership(req.params.id, req.user.id);
    if (!validation.valid) {
      return res.status(validation.error === 'Folder not found' ? 404 : 403).json({ msg: validation.error });
    }
    
    // Get all descendant folders
    const descendantIds = await getAllDescendants(req.params.id);
    
    // Restore all descendant folders
    await Folder.updateMany(
      { _id: { $in: descendantIds } },
      { 
        $set: { 
          isDeleted: false, 
          deletedAt: null 
        } 
      }
    );
    
    // Restore all files in these folders
    await File.updateMany(
      { parentFolder: { $in: descendantIds } },
      { 
        $set: { 
          isDeleted: false, 
          deletedAt: null 
        } 
      }
    );
    
    res.json({ msg: 'Folder restored' });
  } catch (err) {
    console.error('Restore folder error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
