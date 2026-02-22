const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const sanitizeUser = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
};


exports.getDropdown = async ({ role } = {}) => {
  const where = { isActive: true };
  if (role) where.role = String(role).toUpperCase();

  const rows = await User.findAll({
    where,
    attributes: ["id", "name", "role"],
    order: [["name", "ASC"]],
  });

  return rows.map((u) => ({ id: u.id, name: u.name, role: u.role }));
};


exports.listUsers = async ({ q, role, isActive, page, limit } = {}) => {
  const where = {};

  if (role) where.role = String(role).toUpperCase();

  if (String(isActive) === 'true') where.isActive = true;
  if (String(isActive) === 'false') where.isActive = false;

  if (q && String(q).trim()) {
    const s = String(q).trim();
    where[Op.or] = [
      { name: { [Op.iLike]: `%${s}%` } },
      { email: { [Op.iLike]: `%${s}%` } },
      { role: { [Op.iLike]: `%${s}%` } },
    ];
  }

  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const offset = (p - 1) * l;

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
    limit: l,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / l));

  return {
    data: rows.map(sanitizeUser),
    pagination: { page: p, limit: l, total: count, totalPages },
  };
};

exports.getUserById = async (id) => {
  const u = await User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
  });
  if (!u) throw new Error('User not found');
  return sanitizeUser(u);
};

exports.createUser = async ({ name, email, password, role, isActive } = {}) => {
  if (!name) throw new Error('Name is required');
  if (!email) throw new Error('Email is required');
  if (!password) throw new Error('Password is required');

  const exists = await User.findOne({ where: { email } });
  if (exists) throw new Error('Email already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const u = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role ? String(role).toUpperCase() : 'FIELD',
    isActive: typeof isActive === 'boolean' ? isActive : true,
  });

  return sanitizeUser(u);
};

exports.updateUser = async (id, payload = {}, actorUserId) => {
  const u = await User.findByPk(id);
  if (!u) throw new Error('User not found');

  if (String(actorUserId) === String(id) && payload?.isActive === false) {
    throw new Error('You cannot deactivate your own account');
  }

  const name = payload.name != null ? String(payload.name).trim() : null;
  const email = payload.email != null ? String(payload.email).trim() : null;
  const role = payload.role != null ? String(payload.role).toUpperCase() : null;
  const isActive =
    payload.isActive === true ? true : payload.isActive === false ? false : null;

  if (name) u.name = name;

  if (email && email !== u.email) {
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new Error('Email already exists');
    u.email = email;
  }

  if (role) u.role = role;
  if (isActive != null) u.isActive = isActive;

  if (payload.password && String(payload.password).trim()) {
    u.password = await bcrypt.hash(String(payload.password), 10);
  }

  await u.save();
  return sanitizeUser(u);
};

exports.deleteUser = async (id, actorUserId) => {
  if (String(actorUserId) === String(id)) {
    throw new Error('You cannot delete your own account');
  }

  const u = await User.findByPk(id);
  if (!u) throw new Error('User not found');

  await u.destroy();
  return true;
};
