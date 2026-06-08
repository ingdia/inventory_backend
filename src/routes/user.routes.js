const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  updateProfile,
} = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  registerRules,
  updateProfileRules,
  validate,
} = require('../validators/auth.validator');

// All user routes require authentication
router.use(protect);

// Own profile — any authenticated user
router.patch('/profile', updateProfileRules, validate, updateProfile);

// Owner-only routes
router.use(restrictTo('owner'));
router.get('/', getAllUsers);
router.post('/', registerRules, validate, createUser);
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/activate', activateUser);

module.exports = router;
