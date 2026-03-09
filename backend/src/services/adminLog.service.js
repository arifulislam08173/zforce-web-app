const { Op } = require('sequelize');
const { AdminLog, User } = require('../models');

class AdminLogService {
  static async listLogs(query = {}) {
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (query.action) where.action = String(query.action).toUpperCase();
    if (query.entityType) where.entityType = String(query.entityType);
    if (query.actorId) where.actorId = String(query.actorId);
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt[Op.gte] = new Date(`${query.fromDate}T00:00:00.000Z`);
      if (query.toDate) where.createdAt[Op.lte] = new Date(`${query.toDate}T23:59:59.999Z`);
    }

    const q = String(query.q || '').trim();
    if (q) {
      where[Op.or] = [
        { actorName: { [Op.iLike]: `%${q}%` } },
        { actorEmail: { [Op.iLike]: `%${q}%` } },
        { entityType: { [Op.iLike]: `%${q}%` } },
        { entityId: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { rows, count } = await AdminLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'email', 'role'], required: false }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / limit)),
      },
    };
  }
}

module.exports = AdminLogService;
