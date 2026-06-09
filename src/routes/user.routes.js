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

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (owner only except profile)
 */

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update own profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string, example: John }
 *               lastName:  { type: string, example: Doe }
 *               phone:     { type: string, example: '+250788000000' }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/profile', updateProfileRules, validate, updateProfile);

// Owner-only routes
router.use(restrictTo('owner'));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, role]
 *             properties:
 *               firstName: { type: string, example: Jane }
 *               lastName:  { type: string, example: Smith }
 *               email:     { type: string, example: jane@pharmacy.com }
 *               password:  { type: string, example: Password123! }
 *               role:      { type: string, enum: [owner, pharmacist, cashier] }
 *     responses:
 *       201:
 *         description: User created
 */
router.get('/', getAllUsers);
router.post('/', registerRules, validate, createUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName:  { type: string }
 *               role:      { type: string, enum: [owner, pharmacist, cashier] }
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.get('/:id', getUserById);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Activate or deactivate a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User activation status toggled
 */
router.patch('/:id/activate', activateUser);

module.exports = router;
