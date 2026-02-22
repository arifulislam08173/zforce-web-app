const { Op } = require("sequelize");
const { UserCustomerRole } = require("../models");

const dayBefore = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

exports.list = async (filters = {}) => {
  const where = {};
  ["userId", "customerId", "companyId", "region", "area", "territory", "parentId", "role"].forEach((k) => {
    if (filters[k]) where[k] = String(filters[k]);
  });

  if (filters.activeOn) {
    const dateStr = String(filters.activeOn);
    where.effectiveFrom = { [Op.lte]: dateStr };
    where[Op.or] = [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: dateStr } }];
  }

  return UserCustomerRole.findAll({
    where,
    order: [["effectiveFrom", "DESC"]],
    limit: 500,
  });
};

exports.assign = async (payload) => {
  const {
    userId,
    customerId,
    companyId,
    region,
    area,
    territory,
    parentId,
    role,
    effectiveFrom,
  } = payload;

  if (!userId || !customerId || !companyId || !effectiveFrom) {
    const e = new Error("userId, customerId, companyId, effectiveFrom are required");
    e.status = 400;
    throw e;
  }

  const current = await UserCustomerRole.findOne({
    where: { userId, customerId, companyId, effectiveTo: null },
    order: [["effectiveFrom", "DESC"]],
  });

  if (current) {
    current.effectiveTo = dayBefore(effectiveFrom);
    await current.save();
  }

  return UserCustomerRole.create({
    userId,
    customerId,
    companyId,
    region: region || null,
    area: area || null,
    territory: territory || null,
    parentId: parentId || null,
    role: role || null,
    effectiveFrom,
    effectiveTo: null,
  });
};
