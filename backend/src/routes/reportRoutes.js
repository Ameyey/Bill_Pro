const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', reportController.getReports);
router.get('/dashboard', reportController.getReports);
router.get('/detailed', reportController.getDetailedReports);

module.exports = router;

