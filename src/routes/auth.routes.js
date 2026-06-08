const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updatePassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  loginRules,
  registerRules,
  updatePasswordRules,
  validate,
} = require('../validators/auth.validator');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/update-password', protect, updatePasswordRules, validate, updatePassword);

module.exports = router;
