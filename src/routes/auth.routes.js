const express = require('express');
const router = express.Router();
const {
  login,
  refreshToken,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  loginRules,
  updatePasswordRules,
  resetPasswordRules,
  validate,
} = require('../validators/auth.validator');

router.post('/login', loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/update-password', protect, updatePasswordRules, validate, updatePassword);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPasswordRules, validate, resetPassword);

module.exports = router;
