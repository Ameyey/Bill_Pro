const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/status', subscriptionController.getStatus);
router.post('/pay-lifetime', subscriptionController.payLifetime);
router.post('/reset-trial', subscriptionController.resetTrial);

module.exports = router;

