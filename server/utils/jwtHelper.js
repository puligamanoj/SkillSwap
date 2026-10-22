const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a given user ID
 * @param {string} userId
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'fallback_secret_key_skillswap_dev',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret_key_skillswap_dev'
  );
};

module.exports = {
  generateToken,
  verifyToken,
};
