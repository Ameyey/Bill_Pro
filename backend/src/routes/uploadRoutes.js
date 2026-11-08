const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

router.use(auth);

// Multer error handling wrapper
const uploadSingleImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Upload Middleware Error]:', err.message);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error. Only images up to 5MB are allowed.'
      });
    }
    next();
  });
};

router.post('/', uploadSingleImage, uploadController.uploadImage);
router.post('/upload', uploadSingleImage, uploadController.uploadImage);
router.get('/', uploadController.getImages);
router.delete('/:id', uploadController.deleteImage);

module.exports = router;
