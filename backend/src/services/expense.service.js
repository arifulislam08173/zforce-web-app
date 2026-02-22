const { sequelize, Expense, User } = require('../models');
const { Op } = require('sequelize');

const ALLOWED_STATUS = new Set(["PENDING", "APPROVED", "REJECTED"]);

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const toDateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

/**
 * Create Expense (Field user)
 */

exports.createExpense = async (userId, data) => {
  const t = await sequelize.transaction();
  try {
    const category = String(data.category || "").trim();
    const amount = toNumber(data.amount);
    const description = data.description ? String(data.description).trim() : null;
    const receiptUrl = data.receiptUrl ? String(data.receiptUrl).trim() : null;

    // Accept incurredAt as 'YYYY-MM-DD' or full date string
    const incurredAt = toDateOrNull(data.incurredAt) || new Date();

    if (!category) throw new Error("Category is required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than 0");

    const expense = await Expense.create(
      {
        userId,
        amount,
        category,
        description: description || null,
        receiptUrl: receiptUrl || null,
        incurredAt,
        status: "PENDING",
      },
      { transaction: t }
    );

    await t.commit();
    return expense;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};


/**
 * Approve / Reject Expense (Admin / Manager)
 */
exports.updateExpenseStatus = async (expenseId, nextStatus) => {
  const status = String(nextStatus || "").toUpperCase();

  if (!ALLOWED_STATUS.has(status) || status === "PENDING") {
    throw new Error("Invalid status. Allowed: APPROVED, REJECTED");
  }

  const t = await sequelize.transaction();
  try {
    const expense = await Expense.findByPk(expenseId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!expense) throw new Error("Expense not found");

    const current = String(expense.status || "PENDING").toUpperCase();

    if (current !== "PENDING") {
      throw new Error(`Only PENDING expenses can be updated (current: ${current})`);
    }

    expense.status = status;
    await expense.save({ transaction: t });

    await t.commit();
    return expense;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Get Expenses of logged-in user
 */

exports.getMyExpenses = async (userId, query = {}) => {
  const where = { userId };

  const status = query.status ? String(query.status).toUpperCase() : null;
  if (status && ALLOWED_STATUS.has(status)) where.status = status;

  const f = toDateOrNull(query.fromDate);
  const t = toDateOrNull(query.toDate);

  if (f && t) where.incurredAt = { [Op.between]: [f, t] };
  else if (f) where.incurredAt = { [Op.gte]: f };
  else if (t) where.incurredAt = { [Op.lte]: t };

  const page = toInt(query.page, 1);
  const limit = toInt(query.limit, 10);
  const offset = (page - 1) * limit;

  const { rows, count } = await Expense.findAndCountAll({
    where,
    order: [["incurredAt", "DESC"], ["createdAt", "DESC"]],
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / limit));

  return {
    data: rows,
    pagination: { page, limit, total: count, totalPages },
  };
};




/**
 * Expense Report (Admin / Manager)
 */


exports.getExpenseReport = async (query = {}) => {
  const where = {};

  const f = toDateOrNull(query.fromDate);
  const t = toDateOrNull(query.toDate);

  if (f && t) where.incurredAt = { [Op.between]: [f, t] };
  else if (f) where.incurredAt = { [Op.gte]: f };
  else if (t) where.incurredAt = { [Op.lte]: t };

  if (query.userId) where.userId = query.userId;

  const status = query.status ? String(query.status).toUpperCase() : null;
  if (status && ALLOWED_STATUS.has(status)) where.status = status;

  const page = toInt(query.page, 1);
  const limit = toInt(query.limit, 10);
  const offset = (page - 1) * limit;

  const { rows, count } = await Expense.findAndCountAll({
    where,
    include: [{ model: User, as: "user", attributes: ["id", "name"], required: false }],
    order: [["incurredAt", "DESC"], ["createdAt", "DESC"]],
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / limit));

  return {
    data: rows,
    pagination: { page, limit, total: count, totalPages },
  };
};

