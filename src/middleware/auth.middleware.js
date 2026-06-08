const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) return sendError(res, 401, 'User no longer exists.');
    if (!user.isActive) return sendError(res, 403, 'Account is deactivated.');
    if (user.passwordChangedAfter(decoded.iat)) {
      return sendError(res, 401, 'Password recently changed. Please log in again.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired. Please refresh your session.');
    }
    return sendError(res, 401, 'Invalid token.');
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, 403, 'You do not have permission to perform this action.');
  }
  next();
};

module.exports = { protect, restrictTo };
