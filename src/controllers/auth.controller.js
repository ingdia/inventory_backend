const User = require('../models/User');
const crypto = require('crypto');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_OPTIONS,
} = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body;

    // Only owners can create other owners
    if (role === 'owner') {
      const ownerExists = await User.findOne({ role: 'owner' });
      if (ownerExists) {
        // If request comes from a non-owner user attempting to create another owner
        if (!req.user || req.user.role !== 'owner') {
          return sendError(res, 403, 'Only the system owner can create another owner account.');
        }
      }
    }

    const user = await User.create({ firstName, lastName, email, password, role, phone });

    return sendSuccess(res, 201, 'Account created successfully.', { user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');

    // Return early before bcrypt if user not found — prevents unnecessary hash computation
    if (!user) return sendError(res, 401, 'Invalid email or password.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password.');

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Contact the owner.');
    }

    const accessToken = signAccessToken(user._id, user.role);
    const refreshToken = signRefreshToken(user._id);

    // Use updateOne to avoid triggering pre-save hook (faster — no bcrypt re-hash)
    await User.updateOne(
      { _id: user._id },
      { refreshToken, lastLogin: new Date() }
    );

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Strip sensitive fields before sending
    user.password = undefined;
    user.refreshToken = undefined;

    return sendSuccess(res, 200, 'Login successful.', { accessToken, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return sendError(res, 401, 'No refresh token provided.');

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return sendError(res, 401, 'Invalid refresh token. Please log in again.');
    }

    const newAccessToken = signAccessToken(user._id, user.role);
    const newRefreshToken = signRefreshToken(user._id);

    // Use updateOne to skip pre-save hook
    await User.updateOne({ _id: user._id }, { refreshToken: newRefreshToken });

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return sendSuccess(res, 200, 'Token refreshed.', { accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired refresh token. Please log in again.');
    }
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const user = await User.findOne({ refreshToken: token }).select('+refreshToken');
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }
    res.clearCookie('refreshToken');
    return sendSuccess(res, 200, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Profile retrieved.', { user: req.user });
};

// PATCH /api/auth/update-password
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return sendError(res, 401, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    const accessToken = signAccessToken(user._id, user.role);
    return sendSuccess(res, 200, 'Password updated successfully.', { accessToken });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond 200 to prevent email enumeration
    if (!user) {
      return sendSuccess(res, 200, 'If that email exists, a reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    // In production send via email — for now return token in dev mode
    if (process.env.NODE_ENV === 'development') {
      return sendSuccess(res, 200, 'Reset token generated (dev only).', { resetToken });
    }

    return sendSuccess(res, 200, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpiresAt');

    if (!user) return sendError(res, 400, 'Reset token is invalid or has expired.');

    user.password = req.body.password;
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    const accessToken = signAccessToken(user._id, user.role);
    return sendSuccess(res, 200, 'Password reset successful.', { accessToken });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, updatePassword, forgotPassword, resetPassword };
