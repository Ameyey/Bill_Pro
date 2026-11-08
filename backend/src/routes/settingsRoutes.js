const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', settingsController.getCompanySettings);
router.get('/company', settingsController.getCompanySettings);
router.put('/', settingsController.updateCompanySettings);
router.put('/company', settingsController.updateCompanySettings);

module.exports = router;

