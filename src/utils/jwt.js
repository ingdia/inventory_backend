const jwt = require('jsonwebtoken');

const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES,
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  REFRESH_COOKIE_OPTIONS,
};
