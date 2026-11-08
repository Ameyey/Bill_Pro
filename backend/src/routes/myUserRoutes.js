const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const myUserController = require('../controllers/myUserController');

// Strict Super Admin Access Control Middleware:
// ONLY permits requests authenticated as admin@billpro.com.
// Rejects all other users with HTTP 403 Forbidden.
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.email !== 'admin@billpro.com') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Super Admin Access Only. This route (/my_user) is strictly restricted to admin@billpro.com.'
    });
  }
  next();
};

router.post('/admin-login', myUserController.adminLogin);
router.get('/', auth, requireSuperAdmin, myUserController.getMyUsersDashboard);
router.get('/dashboard', auth, requireSuperAdmin, myUserController.getMyUsersDashboard);
router.post('/toggle-login', auth, requireSuperAdmin, myUserController.toggleLoginAllowed);
router.post('/login-as', auth, requireSuperAdmin, myUserController.loginAsUser);
router.post('/update-password', auth, requireSuperAdmin, myUserController.updateUserPassword);

module.exports = router;
