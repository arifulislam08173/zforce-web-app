const jwt = require('jsonwebtoken');
require('dotenv').config();
const { User } = require('../models');
const { enterWithContext } = require('../utils/auditContext');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const dbUser = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'isActive'],
    });

    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      role: dbUser.role,
      email: dbUser.email,
    };

    enterWithContext({
      actor: req.user,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
    });

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    next();
  };
};
