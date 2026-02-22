const { sequelize, Visit, Customer } = require('../models');
const { Op } = require('sequelize');

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

/**
 * Plan a visit (Admin / Manager)
 */

const defaultPlannedAtForDate = (dateStr) => {
  return new Date(`${dateStr}T03:00:00.000Z`);
};

exports.ensureVisitForRoute = async (routePlan, { transaction } = {}) => {
  const existing = await Visit.findOne({
    where: { routeId: routePlan.id },
    transaction,
  });
  if (existing) return existing;

  return Visit.create(
    {
      routeId: routePlan.id,
      userId: routePlan.userId,
      customerId: routePlan.customerId,
      plannedAt: defaultPlannedAtForDate(routePlan.date),
      notes: routePlan.notes || null,
    },
    { transaction }
  );
};

exports.syncVisitForRouteUpdate = async (routePlan, { transaction } = {}) => {
  const v = await Visit.findOne({ where: { routeId: routePlan.id }, transaction });
  if (!v) return null;

  if (String(v.status || "").toUpperCase() !== "PLANNED" || v.checkInAt) return v;

  v.userId = routePlan.userId;
  v.customerId = routePlan.customerId;
  v.plannedAt = defaultPlannedAtForDate(routePlan.date);
  v.notes = routePlan.notes || null;

  await v.save({ transaction });
  return v;
};

exports.deleteVisitForRoute = async (routeId, { transaction } = {}) => {
  const v = await Visit.findOne({ where: { routeId }, transaction });
  if (!v) return false;

  if (String(v.status || "").toUpperCase() !== "PLANNED" || v.checkInAt) return false;

  await v.destroy({ transaction });
  return true;
};


exports.planVisit = async (actor, data) => {
  if (!data?.customerId) throw new Error("Customer is required");
  if (!data?.plannedAt) throw new Error("Planned date & time is required");

  const role = String(actor?.role || "").toUpperCase();
  const actorUserId = String(actor?.id || "");

  let targetUserId = data?.userId;
  if (role === "FIELD") targetUserId = actorUserId;

  if (!targetUserId) throw new Error("User is required");

  return Visit.create({
    userId: targetUserId,
    customerId: data.customerId,
    plannedAt: data.plannedAt,
    notes: data.notes || null,
  });
};


/**
 * Check-in (Field user)
 */
exports.checkIn = async (userId, visitId, { lat, lng }) => {
  const t = await sequelize.transaction();

  try {
    const visit = await Visit.findOne({
      where: { id: visitId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!visit) throw new Error('Visit not found');

    if (visit.checkInAt) throw new Error('Already checked in');

    visit.checkInAt = new Date();
    visit.checkInLat = lat;
    visit.checkInLng = lng;
    visit.status = 'IN_PROGRESS';

    await visit.save({ transaction: t });
    await t.commit();
    return visit;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Check-out (Field user)
 */
exports.checkOut = async (userId, visitId, { lat, lng, notes }) => {
  const t = await sequelize.transaction();

  try {
    const visit = await Visit.findOne({
      where: { id: visitId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!visit) throw new Error('Visit not found');
    if (!visit.checkInAt) throw new Error('Check-in required before check-out');
    if (visit.checkOutAt) throw new Error('Already checked out');

    visit.checkOutAt = new Date();
    visit.checkOutLat = lat;
    visit.checkOutLng = lng;
    visit.status = 'COMPLETED';
    if (notes) visit.notes = notes;

    await visit.save({ transaction: t });
    await t.commit();
    return visit;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * Get visits for logged-in user (Field)
 */
exports.getMyVisits = async (userId, { fromDate, toDate, status, page, limit } = {}) => {
  const where = { userId };

  if (fromDate && toDate) where.plannedAt = { [Op.between]: [fromDate, toDate] };
  if (status) where.status = String(status).toUpperCase();

  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const offset = (p - 1) * l;

  const { rows, count } = await Visit.findAndCountAll({
    where,
    order: [["plannedAt", "ASC"]],
    limit: l,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / l));

  return {
    data: rows,
    pagination: { page: p, limit: l, total: count, totalPages },
  };
};

/**
 * Visit report (Admin / Manager)
 */
exports.getVisitReport = async ({ fromDate, toDate, userId, status, page, limit } = {}) => {
  const where = {};

  if (fromDate && toDate) where.plannedAt = { [Op.between]: [fromDate, toDate] };
  if (userId) where.userId = userId;
  if (status) where.status = String(status).toUpperCase();

  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const offset = (p - 1) * l;

  const { rows, count } = await Visit.findAndCountAll({
    where,
    order: [["plannedAt", "ASC"]],
    limit: l,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / l));

  return {
    data: rows,
    pagination: { page: p, limit: l, total: count, totalPages },
  };
};
