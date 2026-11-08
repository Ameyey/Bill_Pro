const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'billpro_production_secret_key_2026_xyz';
const JWT_EXPIRES_IN = '30d';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'admin'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken
};

