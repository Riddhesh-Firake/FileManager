const router = require('express').Router();
const multer = require('multer');
const B2 = require('backblaze-b2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');
const { v4: uuidv4 } = require('uuid');

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

const upload = multer({ storage: multer.memoryStorage() });

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY
});

// --- ROUTES ---

// 1. Upload File
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.storageUsed + req.file.size > user.storageLimit) {
      return res.status(400).json({ msg: 'Storage quota exceeded (250MB limit)' });
    }

    await b2.authorize();
    const response = await b2.getUploadUrl({ bucketId: process.env.B2_BUCKET_ID });
    
    const sanitizedOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user._id}/${uuidv4()}-${sanitizedOriginalName}`;
    
    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: fileName,
      data: req.file.buffer,
      mime: req.file.mimetype
    });

    const newFile = new File({
      user: user._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      b2FileId: uploadResponse.data.fileId,
      b2FileName: uploadResponse.data.fileName
    });

    await newFile.save();
    user.storageUsed += req.file.size;
    await user.save();

    res.json(newFile);
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get User's Own Files
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    const user = await User.findById(req.user.id).select('storageUsed storageLimit');
    res.json({ files, storage: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Files Shared WITH Me (New Route)
router.get('/shared', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Find files where sharedWith array contains user's email
    const files = await File.find({ sharedWith: user.email, isDeleted: false })
      .populate('user', 'name email') // Get owner info
      .sort({ createdAt: -1 });
      
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Share File (New Route)
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    if (!file.sharedWith.includes(email)) {
      file.sharedWith.push(email);
      await file.save();
    }
    res.json({ msg: 'File shared successfully', file });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Rename File
router.put('/:id', auth, async (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ msg: 'New name is required' });

    let file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    if (file.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    file.fileName = newName;
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Toggle Star
router.put('/:id/star', auth, async (req, res) => {
  try {
    let file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    
    // Allow owner OR shared user to star (locally this toggles for the file globally in this simple version, 
    // a production app would have a separate 'stars' collection)
    if (file.user.toString() !== req.user.id) {
       // Check if shared
       // For simplicity in this version, only owner can modify star status on the file object
       return res.status(401).json({ msg: 'Only owner can star files currently' });
    }

    file.isStarred = !file.isStarred;
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Soft Delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if(!file) return res.status(404).json({msg: "File not found"});
        if(file.user.toString() !== req.user.id) return res.status(401).json({msg: "Not authorized"});

        file.isDeleted = true;
        file.deletedAt = Date.now();
        await file.save();

        res.json({msg: "File moved to trash"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. Restore File
router.put('/:id/restore', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if(!file) return res.status(404).json({msg: "File not found"});
        if(file.user.toString() !== req.user.id) return res.status(401).json({msg: "Not authorized"});

        file.isDeleted = false;
        file.deletedAt = null;
        await file.save();

        res.json({msg: "File restored"});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. Permanent Delete
router.delete('/:id/permanent', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if(!file) return res.status(404).json({msg: "File not found"});
        if(file.user.toString() !== req.user.id) return res.status(401).json({msg: "Not authorized"});

        await b2.authorize();
        await b2.deleteFileVersion({
            fileName: file.b2FileName,
            fileId: file.b2FileId
        });

        const user = await User.findById(req.user.id);
        user.storageUsed -= file.fileSize;
        if(user.storageUsed < 0) user.storageUsed = 0;
        await user.save();

        await File.findByIdAndDelete(req.params.id);

        res.json({msg: "File permanently deleted"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 10. Download/View
router.get('/:id/download', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'File not found' });
    
    // Check ownership OR if shared
    const user = await User.findById(req.user.id);
    const isOwner = file.user.toString() === req.user.id;
    const isShared = file.sharedWith.includes(user.email);

    if (!isOwner && !isShared) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const authResponse = await b2.authorize();
    const downloadUrlBase = authResponse.data.downloadUrl;
    
    const downloadAuth = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix: file.b2FileName,
      validDurationInSeconds: 3600 
    });

    const signedUrl = `${downloadUrlBase}/file/${process.env.B2_BUCKET_NAME}/${file.b2FileName}?Authorization=${downloadAuth.data.authorizationToken}`;
    
    res.json({ downloadUrl: signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;