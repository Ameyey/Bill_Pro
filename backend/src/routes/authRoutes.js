const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe || ((req, res) => res.json({ success: true, user: req.user })));
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;

