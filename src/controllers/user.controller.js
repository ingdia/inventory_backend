const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/users — Owner only
const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Users retrieved.', {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id — Owner only
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User retrieved.', { user });
  } catch (err) {
    next(err);
  }
};

// POST /api/users — Owner creates user
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body;
    const user = await User.create({ firstName, lastName, email, password, role, phone });
    return sendSuccess(res, 201, 'User created successfully.', { user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id — Owner updates user
const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, role, isActive } = req.body;
    const allowedUpdates = { firstName, lastName, phone, role, isActive };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, {
      new: true,
      runValidators: true,
    });
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User updated successfully.', { user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — Owner only (soft delete via deactivation)
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, 'You cannot delete your own account.');
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/activate — Owner restores user
const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!user) return sendError(res, 404, 'User not found.');
    return sendSuccess(res, 200, 'User activated successfully.', { user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/profile — Any logged in user updates own profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, 200, 'Profile updated successfully.', { user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, activateUser, updateProfile };
