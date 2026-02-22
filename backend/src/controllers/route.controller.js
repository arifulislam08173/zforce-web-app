const { Op } = require("sequelize");
const { sequelize, RoutePlan, User, Customer } = require("../models");
const visitService = require("../services/visit.service");

const safeInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

exports.getAll = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const authUserId = req.user?.id;

    const page = safeInt(req.query.page, 1);
    const limit = safeInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    const {
      search = "",
      userId = "",
      customerId = "",
      dateFrom = "",
      dateTo = "",
    } = req.query;

    const where = {};

    // FIELD only sees own routes
    if (role === "FIELD") {
      where.userId = authUserId;
      if (customerId) where.customerId = customerId;
    } else {
      if (userId) where.userId = userId;
      if (customerId) where.customerId = customerId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = dateFrom;
      if (dateTo) where.date[Op.lte] = dateTo;
    }

    // Search across joined user/customer name (OR)
    const s = String(search || "").trim();
    if (s) {
      where[Op.or] = [
        { "$user.name$": { [Op.iLike]: `%${s}%` } },
        { "$customer.name$": { [Op.iLike]: `%${s}%` } },
      ];
    }

    const { rows, count } = await RoutePlan.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "name"], required: false },
        { model: Customer, as: "customer", attributes: ["id", "name"], required: false },
      ],
      order: [["date", "DESC"], ["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const mapped = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      customerId: r.customerId,
      date: r.date,
      notes: r.notes || "",
      userName: r.user?.name || "",
      customerName: r.customer?.name || "",
    }));

    res.json({
      data: mapped,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const role = req.user?.role;
    const authUserId = req.user?.id;

    const r = await RoutePlan.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name"], required: false },
        { model: Customer, as: "customer", attributes: ["id", "name"], required: false },
      ],
    });

    if (!r) return res.status(404).json({ message: "Route not found" });

    // FIELD can only view own route
    if (role === "FIELD" && r.userId !== authUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({
      id: r.id,
      userId: r.userId,
      customerId: r.customerId,
      date: r.date,
      notes: r.notes || "",
      userName: r.user?.name || "",
      customerName: r.customer?.name || "",
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { userId, customerId, date, notes } = req.body;

    if (!userId || !customerId || !date) {
      await t.rollback();
      return res.status(400).json({ message: "userId, customerId, date required" });
    }

    const created = await RoutePlan.create(
      {
        userId,
        customerId,
        date,
        notes: notes || null,
      },
      { transaction: t }
    );

    await visitService.ensureVisitForRoute(created, { transaction: t });

    await t.commit();
    res.status(201).json(created);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { userId, customerId, date, notes } = req.body;

    const r = await RoutePlan.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!r) {
      await t.rollback();
      return res.status(404).json({ message: "Route not found" });
    }

    await r.update(
      {
        userId: userId ?? r.userId,
        customerId: customerId ?? r.customerId,
        date: date ?? r.date,
        notes: notes ?? r.notes,
      },
      { transaction: t }
    );

    await visitService.syncVisitForRouteUpdate(r, { transaction: t });

    await t.commit();
    res.json(r);
  } catch (err) {
    await t.rollback();
    next(err);
  }
};


exports.remove = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const r = await RoutePlan.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!r) {
      await t.rollback();
      return res.status(404).json({ message: "Route not found" });
    }

    await visitService.deleteVisitForRoute(r.id, { transaction: t });

    await r.destroy({ transaction: t });

    await t.commit();
    res.json({ message: "Deleted" });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

