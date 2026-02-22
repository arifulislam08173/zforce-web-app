const { Op } = require("sequelize");
const { UserCompany, User } = require("../models");

const dayBefore = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

exports.list = async (filters = {}) => {
  const where = {};
  ["userId", "companyId", "departmentId", "designationId"].forEach((k) => {
    if (filters[k]) where[k] = String(filters[k]);
  });

  return UserCompany.findAll({
    where,
    order: [["effectiveFrom", "DESC"]],
    limit: 500,
  });
};

exports.assign = async (payload) => {
  const { userId, companyId, departmentId, designationId, effectiveFrom } = payload;
  if (!userId || !companyId || !effectiveFrom) {
    const e = new Error("userId, companyId and effectiveFrom are required");
    e.status = 400;
    throw e;
  }

  // close currently active record (same user+company)
  const current = await UserCompany.findOne({
    where: { userId, companyId, effectiveTo: null },
    order: [["effectiveFrom", "DESC"]],
  });

  if (current) {
    current.effectiveTo = dayBefore(effectiveFrom);
    await current.save();
  }

  return UserCompany.create({
    userId,
    companyId,
    departmentId: departmentId || null,
    designationId: designationId || null,
    effectiveFrom,
    effectiveTo: null,
  });
};



const activeOnWhere = (dateStr) => ({
  effectiveFrom: { [Op.lte]: dateStr },
  [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: dateStr } }],
});

exports.eligibleUsers = async ({ companyId, activeOn }) => {
  const dateStr = activeOn || new Date().toISOString().slice(0, 10);
  if (!companyId) {
    const e = new Error("companyId is required");
    e.status = 400;
    throw e;
  }

  const rows = await UserCompany.findAll({
    where: { companyId: String(companyId), ...activeOnWhere(dateStr) },
    include: [{ model: User, as: "user", attributes: ["id", "name", "role"] }],
    order: [[{ model: User, as: "user" }, "name", "ASC"]],
    limit: 1000,
  });

  // return unique users
  const map = new Map();
  for (const r of rows) {
    if (r.user) map.set(String(r.user.id), r.user);
  }

  return Array.from(map.values());
};