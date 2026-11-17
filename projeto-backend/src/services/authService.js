const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');

async function generateToken({ email, password } = {}) {
  if (!email || !password) {
    throw new AppError(400, 'E-mail e senha são obrigatórios');
  }

  const user = await User.findOne({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.password));

  if (!valid) {
    throw new AppError(400, 'E-mail ou senha inválidos');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  return { token };
}

module.exports = { generateToken };
