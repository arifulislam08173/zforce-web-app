const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

/**
 * Login user
 */
exports.login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({
    where: { email, isActive: true }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = generateAccessToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,

      faceEnrolled: user.faceEnrolled,
      faceEnrollAt: user.faceEnrollAt,
    }
  };
};

/**
 * Create user (Admin)
 */
exports.createUser = async ({ name, email, password, role }) => {
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

/**
 * Get user profile
 */
exports.getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'role', "faceEnrolled", "faceEnrollAt"]
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
