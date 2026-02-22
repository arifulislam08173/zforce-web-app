const { sequelize, Collection, Order, Customer, User } = require("../models");
const { Op } = require("sequelize");
const { getOrderSummary, recomputeAndUpdateOrderPayment } = require("./paymentSummary.service");

const normalize = (v) => String(v || "").trim().toUpperCase();

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const toUtcDayRange = (fromDate, toDate) => {
  const hasTime = (s) => typeof s === "string" && s.includes("T");
  if (!fromDate || !toDate) return null;

  const start = hasTime(fromDate)
    ? new Date(fromDate)
    : new Date(`${fromDate}T00:00:00.000Z`);

  const end = hasTime(toDate)
    ? new Date(toDate)
    : new Date(`${toDate}T23:59:59.999Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
};

/**
 * Create collection (FIELD)
 */
exports.createCollection = async (userId, data) => {
  return sequelize.transaction(async (t) => {
    const orderId = String(data?.orderId || "").trim();
    if (!orderId) {
      const e = new Error("Order is required");
      e.status = 400;
      throw e;
    }

    // Lock order row (avoid race)
    const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!order) {
      const e = new Error("Order not found");
      e.status = 404;
      throw e;
    }

    const amount = Number(data?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      const e = new Error("Amount must be > 0");
      e.status = 400;
      throw e;
    }

    const paymentType = normalize(data?.paymentType);
    if (!["CASH", "UPI", "CHEQUE"].includes(paymentType)) {
      const e = new Error("Invalid paymentType. Use CASH, UPI, CHEQUE");
      e.status = 400;
      throw e;
    }

    // Single source of truth for totals
    const summary = await getOrderSummary(orderId, { transaction: t });

    const availableDue = Number(summary?.availableDue ?? summary?.due ?? 0);

    if (availableDue <= 0) {
      const e = new Error("This order has no due amount left");
      e.status = 400;
      throw e;
    }

    if (amount > availableDue) {
      const e = new Error(`Amount exceeds due. Due is ${availableDue}`);
      e.status = 400;
      throw e;
    }

    const collection = await Collection.create(
      {
        userId,
        orderId,
        amount,
        paymentType,
        receiptUrl: (data?.receiptUrl || "").trim() || null,
        status: "PENDING",
        collectedAt: new Date(),
      },
      { transaction: t }
    );

    return collection;
  });
};


/**
 * Update status (ADMIN/MANAGER)
 */
exports.updateCollectionStatus = async (collectionId, status) => {
  const nextStatus = normalize(status);
  if (!["APPROVED", "REJECTED"].includes(nextStatus)) {
    const e = new Error("Invalid status. Use APPROVED or REJECTED");
    e.status = 400;
    throw e;
  }

  return sequelize.transaction(async (t) => {
    const collection = await Collection.findByPk(collectionId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!collection) {
      const e = new Error("Collection not found");
      e.status = 404;
      throw e;
    }

    const current = normalize(collection.status);
    if (current !== "PENDING") {
      const e = new Error(`Cannot change status. Already ${current}`);
      e.status = 400;
      throw e;
    }

    collection.status = nextStatus;
    await collection.save({ transaction: t });

    let summary = null;
    if (nextStatus === "APPROVED") {
      summary = await recomputeAndUpdateOrderPayment(collection.orderId, t);
    }

    return { collection, summary };
  });
};

/**
 * My collections (FIELD)
 */
exports.getMyCollections = async (userId, query = {}) => {
  const where = { userId };

  if (query.status) where.status = normalize(query.status);

  const range = toUtcDayRange(query.fromDate, query.toDate);
  if (range) where.collectedAt = { [Op.between]: [range.start, range.end] };

  const page = toInt(query.page, 1);
  const limit = toInt(query.limit, 10);
  const offset = (page - 1) * limit;

  const { rows, count } = await Collection.findAndCountAll({
    where,
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "orderNumber", "totalAmount", "paidAmount", "paymentStatus", "customerId"],
        include: [{ model: Customer, as: "customer", attributes: ["id", "name", "phone"] }],
      },
    ],
    order: [["collectedAt", "DESC"], ["createdAt", "DESC"]],
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / limit));
  return { data: rows, pagination: { page, limit, total: count, totalPages } };
};

/**
 * Report (ADMIN/MANAGER)
 */
exports.getCollectionReport = async (query = {}) => {
  const where = {};

  const range = toUtcDayRange(query.fromDate, query.toDate);
  if (range) where.collectedAt = { [Op.between]: [range.start, range.end] };

  if (query.userId) where.userId = query.userId;
  if (query.status) where.status = normalize(query.status);

  const page = toInt(query.page, 1);
  const limit = toInt(query.limit, 10);
  const offset = (page - 1) * limit;

  const { rows, count } = await Collection.findAndCountAll({
    where,
    include: [
      { model: User, as: "user", attributes: ["id", "name"] },
      {
        model: Order,
        as: "order",
        attributes: ["id", "orderNumber", "totalAmount", "paidAmount", "paymentStatus", "customerId"],
        include: [{ model: Customer, as: "customer", attributes: ["id", "name", "phone"] }],
      },
    ],
    order: [["collectedAt", "DESC"], ["createdAt", "DESC"]],
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / limit));
  return { data: rows, pagination: { page, limit, total: count, totalPages } };
};
