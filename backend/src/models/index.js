const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { getAuditContext } = require('../utils/auditContext');

const User = require("./user.model")(sequelize, DataTypes);
const Attendance = require("./attendance.model")(sequelize, DataTypes);
const Order = require("./order.model")(sequelize, DataTypes);
const OrderItem = require("./orderItem.model")(sequelize, DataTypes);
const Customer = require("./customer.model")(sequelize, DataTypes);
const Visit = require("./visit.model")(sequelize, DataTypes);
const Product = require("./product.model")(sequelize, DataTypes);
const Expense = require("./expense.model")(sequelize, DataTypes);
const Collection = require("./collection.model")(sequelize, DataTypes);
const RoutePlan = require("./route.model")(sequelize, DataTypes);
const Company = require("./company.model")(sequelize, DataTypes);
const UserCompany = require("./userCompany.model")(sequelize, DataTypes);
const UserCustomerRole = require("./userCustomerRole.model")(sequelize, DataTypes);
const UserOrderRole = require("./userOrderRole.model")(sequelize, DataTypes);
const OrderCounter = require("./orderCounter.model")(sequelize, DataTypes);
const AdminLog = require('./adminLog.model')(sequelize, DataTypes);

const models = {
  sequelize,
  User,
  Attendance,
  Order,
  OrderItem,
  Customer,
  RoutePlan,
  Visit,
  Product,
  Expense,
  Collection,
  Company,
  UserCompany,
  UserCustomerRole,
  UserOrderRole,
  OrderCounter,
  AdminLog,
};

Object.values(models).forEach((model) => {
  if (model && typeof model.associate === "function") {
    model.associate(models);
  }
});

const SENSITIVE_FIELDS = new Set(['password', 'faceEmbedding']);

function sanitizeSnapshot(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitizeSnapshot);
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Buffer.isBuffer(value)) return value.toString('base64');

  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    clean[key] = SENSITIVE_FIELDS.has(key) ? '[REDACTED]' : sanitizeSnapshot(val);
  }
  return clean;
}

function addAuditHooks(modelName, model) {
  if (!model || modelName === 'AdminLog' || modelName === 'sequelize') return;

  model.addHook('afterCreate', async (instance, options) => {
    const ctx = getAuditContext();
    if (!ctx?.actor || !['ADMIN', 'MANAGER'].includes(String(ctx.actor.role || '').toUpperCase())) return;

    await models.AdminLog.create({
      actorId: ctx.actor.id || null,
      actorName: ctx.actor.name || null,
      actorEmail: ctx.actor.email || null,
      actorRole: ctx.actor.role || null,
      action: 'CREATE',
      entityType: modelName,
      entityId: String(instance.id || instance.get?.('id') || ''),
      description: `${ctx.actor.name || ctx.actor.email || 'Unknown'} created ${modelName}`,
      beforeData: null,
      afterData: sanitizeSnapshot(instance.toJSON ? instance.toJSON() : instance),
      metadata: { source: 'sequelize-hook' },
      ipAddress: ctx.ipAddress || null,
      userAgent: ctx.userAgent || null,
    }, { transaction: options.transaction });
  });

  model.addHook('afterUpdate', async (instance, options) => {
    const ctx = getAuditContext();
    if (!ctx?.actor || !['ADMIN', 'MANAGER'].includes(String(ctx.actor.role || '').toUpperCase())) return;

    const prev = sanitizeSnapshot(instance._previousDataValues || {});
    const next = sanitizeSnapshot(instance.toJSON ? instance.toJSON() : instance);

    await models.AdminLog.create({
      actorId: ctx.actor.id || null,
      actorName: ctx.actor.name || null,
      actorEmail: ctx.actor.email || null,
      actorRole: ctx.actor.role || null,
      action: 'UPDATE',
      entityType: modelName,
      entityId: String(instance.id || instance.get?.('id') || ''),
      description: `${ctx.actor.name || ctx.actor.email || 'Unknown'} updated ${modelName}`,
      beforeData: prev,
      afterData: next,
      metadata: { source: 'sequelize-hook', changedFields: instance.changed?.() || [] },
      ipAddress: ctx.ipAddress || null,
      userAgent: ctx.userAgent || null,
    }, { transaction: options.transaction });
  });

  model.addHook('beforeDestroy', async (instance, options) => {
    const ctx = getAuditContext();
    if (!ctx?.actor || !['ADMIN', 'MANAGER'].includes(String(ctx.actor.role || '').toUpperCase())) return;

    await models.AdminLog.create({
      actorId: ctx.actor.id || null,
      actorName: ctx.actor.name || null,
      actorEmail: ctx.actor.email || null,
      actorRole: ctx.actor.role || null,
      action: 'DELETE',
      entityType: modelName,
      entityId: String(instance.id || instance.get?.('id') || ''),
      description: `${ctx.actor.name || ctx.actor.email || 'Unknown'} deleted ${modelName}`,
      beforeData: sanitizeSnapshot(instance.toJSON ? instance.toJSON() : instance),
      afterData: null,
      metadata: { source: 'sequelize-hook' },
      ipAddress: ctx.ipAddress || null,
      userAgent: ctx.userAgent || null,
    }, { transaction: options.transaction });
  });
}

Object.entries(models).forEach(([modelName, model]) => addAuditHooks(modelName, model));

module.exports = models;
