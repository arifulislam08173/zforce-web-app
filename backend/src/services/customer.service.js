// const { Op } = require('sequelize');
// const { Customer, User } = require('../models');

// const toInt = (v, def) => {
//   const n = parseInt(v, 10);
//   return Number.isFinite(n) && n > 0 ? n : def;
// };

// const normalizeStr = (v) => String(v || '').trim();

// exports.getDropdown = async () => {
//   return Customer.findAll({
//     where: { status: 'ACTIVE' },
//     attributes: ['id', 'name', 'phone'],
//     order: [['name', 'ASC']],
//     limit: 200,
//   });
// };


// exports.listCustomers = async ({ page, limit, q, status, assignedTo } = {}) => {
//   const where = {};

//   const qStr = normalizeStr(q);
//   if (qStr) {
//     where[Op.or] = [
//       { name: { [Op.iLike]: `%${qStr}%` } },
//       { phone: { [Op.iLike]: `%${qStr}%` } },
//       { email: { [Op.iLike]: `%${qStr}%` } },
//       { city: { [Op.iLike]: `%${qStr}%` } },
//       { address: { [Op.iLike]: `%${qStr}%` } },
//     ];
//   }

//   const st = normalizeStr(status);
//   if (st) where.status = st.toUpperCase();

//   const asg = normalizeStr(assignedTo);
//   if (asg) where.assignedTo = asg;

//   const p = toInt(page, 1);
//   const l = toInt(limit, 10);
//   const offset = (p - 1) * l;

//   const { rows, count } = await Customer.findAndCountAll({
//     where,
//     include: [
//       {
//         model: User,
//         as: 'fieldUser',
//         attributes: ['id', 'name'],
//         required: false,
//       },
//     ],
//     order: [['createdAt', 'DESC']],
//     limit: l,
//     offset,
//   });

//   const totalPages = Math.max(1, Math.ceil(count / l));
//   return {
//     data: rows,
//     pagination: { page: p, limit: l, total: count, totalPages },
//   };
// };

// exports.createCustomer = async (data) => {
//   return Customer.create({
//     name: data.name,
//     phone: data.phone || null,
//     email: data.email || null,
//     address: data.address || null,
//     city: data.city || null,
//     state: data.state || null,
//     zip: data.zip || null,
//     status: (data.status || 'ACTIVE').toUpperCase(),
//     assignedTo: data.assignedTo || null,
//   });
// };

// exports.getCustomerById = async (id) => {
//   return Customer.findByPk(id, {
//     include: [
//       {
//         model: User,
//         as: 'fieldUser',
//         attributes: ['id', 'name'],
//         required: false,
//       },
//     ],
//   });
// };

// exports.updateCustomer = async (id, data) => {
//   const customer = await Customer.findByPk(id);
//   if (!customer) throw new Error('Customer not found');

//   customer.name = data.name ?? customer.name;
//   customer.phone = data.phone ?? customer.phone;
//   customer.email = data.email ?? customer.email;
//   customer.address = data.address ?? customer.address;
//   customer.city = data.city ?? customer.city;
//   customer.state = data.state ?? customer.state;
//   customer.zip = data.zip ?? customer.zip;
//   if (data.status) customer.status = String(data.status).toUpperCase();
//   customer.assignedTo = data.assignedTo ?? customer.assignedTo;

//   await customer.save();
//   return customer;
// };

// exports.deleteCustomer = async (id) => {
//   const customer = await Customer.findByPk(id);
//   if (!customer) throw new Error('Customer not found');
//   await customer.destroy();
//   return true;
// };







// backend/src/services/customer.service.js
const { Op } = require("sequelize");
const { Customer, UserCustomerRole } = require("../models");

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const normalizeStr = (v) => String(v || "").trim();

const activeOnWhere = (dateStr) => {
  return {
    effectiveFrom: { [Op.lte]: dateStr },
    [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: dateStr } }],
  };
};

/**
 * Dropdown:
 * - ADMIN/MANAGER: all ACTIVE customers
 * - FIELD: only assigned customers (by UserCustomerRole) active on date
 */
exports.getDropdown = async (user, { date } = {}) => {
  const dateStr = date || new Date().toISOString().slice(0, 10);

  if (String(user?.role || "").toUpperCase() === "FIELD") {
    const roles = await UserCustomerRole.findAll({
      where: { userId: user.id, ...activeOnWhere(dateStr) },
      attributes: ["customerId"],
      group: ["customerId"],
      limit: 500,
    });

    const ids = roles.map((r) => r.customerId);
    if (!ids.length) return [];

    return Customer.findAll({
      where: { id: { [Op.in]: ids }, status: "ACTIVE" },
      attributes: ["id", "name", "phone"],
      order: [["name", "ASC"]],
      limit: 500,
    });
  }

  return Customer.findAll({
    where: { status: "ACTIVE" },
    attributes: ["id", "name", "phone"],
    order: [["name", "ASC"]],
    limit: 500,
  });
};

/**
 * List customers (Admin/Manager)
 * Query: page, limit, q, status
 */
exports.listCustomers = async ({ page, limit, q, status } = {}) => {
  const where = {};

  const qStr = normalizeStr(q);
  if (qStr) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${qStr}%` } },
      { phone: { [Op.iLike]: `%${qStr}%` } },
      { email: { [Op.iLike]: `%${qStr}%` } },
      { city: { [Op.iLike]: `%${qStr}%` } },
      { address: { [Op.iLike]: `%${qStr}%` } },
    ];
  }

  const st = normalizeStr(status);
  if (st) where.status = st.toUpperCase();

  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const offset = (p - 1) * l;

  const { rows, count } = await Customer.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: l,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / l));
  return {
    data: rows,
    pagination: { page: p, limit: l, total: count, totalPages },
  };
};

exports.getCustomerById = async (id) => Customer.findByPk(id);

exports.createCustomer = async (data) =>
  Customer.create({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zip: data.zip || null,
    status: data.status || "ACTIVE",
  });

exports.updateCustomer = async (id, data) => {
  const c = await Customer.findByPk(id);
  if (!c) return null;

  await c.update({
    name: data.name ?? c.name,
    phone: data.phone ?? c.phone,
    email: data.email ?? c.email,
    address: data.address ?? c.address,
    city: data.city ?? c.city,
    state: data.state ?? c.state,
    zip: data.zip ?? c.zip,
    status: data.status ?? c.status,
  });

  return c;
};

exports.deleteCustomer = async (id) => {
  const c = await Customer.findByPk(id);
  if (!c) return false;
  await c.destroy();
  return true;
};
