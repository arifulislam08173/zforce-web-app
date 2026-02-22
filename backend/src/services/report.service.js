const { Op, Sequelize } = require("sequelize");
const { Order, User, Customer, UserOrderRole } = require("../models");

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const normalize = (v) => String(v || "").trim();

const buildDateWhere = (query) => {
  const fromDate = query.fromDate || query.from || null;
  const toDate = query.toDate || query.to || null;

  if (!fromDate && !toDate) return null;

  const w = {};
  if (fromDate) w[Op.gte] = fromDate; // YYYY-MM-DD
  if (toDate) w[Op.lte] = toDate; // YYYY-MM-DD
  return w;
};

const buildOrderWhere = (query) => {
  const where = {};

  if (query.status) where.status = String(query.status).toUpperCase();
  if (query.userId) where.userId = String(query.userId);
  if (query.customerId) where.customerId = String(query.customerId);
  if (query.status) where.status = String(query.status).toUpperCase();
  if (query.paymentStatus)
    where.paymentStatus = String(query.paymentStatus).toUpperCase();

  const dateWhere = buildDateWhere(query);
  if (dateWhere) where.date = dateWhere;

  // search in order list view
  const q = normalize(query.q);
  if (q) {
    const like = `%${q}%`;
    where[Op.or] = [
      Sequelize.where(Sequelize.cast(Sequelize.col("Order.id"), "text"), {
        [Op.iLike]: like,
      }),
      { "$customer.name$": { [Op.iLike]: like } },
      { "$customer.phone$": { [Op.iLike]: like } },
      { "$user.name$": { [Op.iLike]: like } },
      { orderNumber: { [Op.iLike]: like } },
    ];
  }

  return where;
};

const buildRoleWhereAndInclude = (query) => {
  const roleWhere = {};
  let roleFilterOn = false;

  ["companyId", "region", "area", "territory", "parentId", "role"].forEach(
    (k) => {
      if (query[k]) {
        roleWhere[k] = String(query[k]);
        roleFilterOn = true;
      }
    },
  );

  // always include orderRole because reports depend on it
  return {
    roleWhere,
    roleFilterOn,
    include: {
      model: UserOrderRole,
      as: "orderRole",
      required: roleFilterOn, // filter if provided
      where: roleFilterOn ? roleWhere : undefined,
      attributes: [], // for aggregates we pick columns manually
    },
  };
};

class ReportService {
  /**
   * List orders with role data (for report table)
   */
  static async orders(user, query = {}) {
    // only ADMIN/MANAGER
    if (!["ADMIN", "MANAGER"].includes(String(user.role).toUpperCase())) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const page = toInt(query.page, 1);
    const limit = Math.min(toInt(query.limit, 20), 200);
    const offset = (page - 1) * limit;

    const where = buildOrderWhere(query);
    const { include: orderRoleInclude } = buildRoleWhereAndInclude(query);

    const include = [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
      {
        ...orderRoleInclude,
        attributes: [
          "companyId",
          "region",
          "area",
          "territory",
          "parentId",
          "role",
        ],
      },
    ];

    const { rows, count } = await Order.findAndCountAll({
      where,
      include,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      subQuery: false,
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

  /**
   * Summary report via groupBy
   * groupBy options:
   * - user
   * - customer
   * - area
   * - territory
   * - region
   * - company
   * - parent (manager)
   * - month
   * - day
   */
  static async summary(user, query = {}) {
    if (!["ADMIN", "MANAGER"].includes(String(user.role).toUpperCase())) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const groupBy = normalize(query.groupBy || "user").toLowerCase();

    const where = buildOrderWhere(query);
    const { include: orderRoleInclude } = buildRoleWhereAndInclude(query);

    // Grouping key & selected columns
    const group = [];
    const attributes = [
      [Sequelize.fn("COUNT", Sequelize.col("Order.id")), "totalOrders"],
      [
        Sequelize.fn(
          "COALESCE",
          Sequelize.fn("SUM", Sequelize.col("Order.totalAmount")),
          0,
        ),
        "totalSales",
      ],
      [
        Sequelize.fn(
          "COALESCE",
          Sequelize.fn("AVG", Sequelize.col("Order.totalAmount")),
          0,
        ),
        "avgOrderValue",
      ],
    ];

    // Always include user/customer for names when needed
    const include = [
      { model: User, as: "user", attributes: [] },
      { model: Customer, as: "customer", attributes: [] },
      orderRoleInclude,
    ];

    // helper columns
    const col = (c) => Sequelize.col(c);
    const dateCol = Sequelize.col("Order.date");

    if (groupBy === "user") {
      attributes.push(
        [col("user.id"), "userId"],
        [col("user.name"), "userName"],
      );
      group.push(col("user.id"), col("user.name"));
      include[0] = { model: User, as: "user", attributes: ["id", "name"] };
    } else if (groupBy === "customer") {
      attributes.push(
        [col("customer.id"), "customerId"],
        [col("customer.name"), "customerName"],
      );
      group.push(col("customer.id"), col("customer.name"));
      include[1] = {
        model: Customer,
        as: "customer",
        attributes: ["id", "name"],
      };
    } else if (groupBy === "company") {
      attributes.push([col("orderRole.companyId"), "companyId"]);
      group.push(col("orderRole.companyId"));
    } else if (groupBy === "region") {
      attributes.push([col("orderRole.region"), "region"]);
      group.push(col("orderRole.region"));
    } else if (groupBy === "area") {
      attributes.push([col("orderRole.area"), "area"]);
      group.push(col("orderRole.area"));
    } else if (groupBy === "territory") {
      attributes.push([col("orderRole.territory"), "territory"]);
      group.push(col("orderRole.territory"));
    } else if (groupBy === "parent") {
      attributes.push([col("orderRole.parentId"), "parentId"]);
      group.push(col("orderRole.parentId"));
    } else if (groupBy === "month") {
      // YYYY-MM
      attributes.push([Sequelize.fn("to_char", dateCol, "YYYY-MM"), "month"]);
      group.push(Sequelize.fn("to_char", dateCol, "YYYY-MM"));
    } else if (groupBy === "day") {
      // YYYY-MM-DD
      attributes.push([Sequelize.fn("to_char", dateCol, "YYYY-MM-DD"), "day"]);
      group.push(Sequelize.fn("to_char", dateCol, "YYYY-MM-DD"));
    } else {
      const err = new Error("Invalid groupBy");
      err.status = 400;
      throw err;
    }

    include[2] = { ...orderRoleInclude, required: true };

    const rows = await Order.findAll({
      where,
      include,
      attributes,
      group,
      order: [[Sequelize.literal('"totalSales"'), "DESC"]],
      raw: true,
      subQuery: false,
    });

    return { groupBy, data: rows };
  }

  /**
   * Performance report for users (salesman/team etc.)
   */
  static async performance(user, query = {}) {
    if (!["ADMIN", "MANAGER"].includes(String(user.role).toUpperCase())) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    // force group by user, but allow all role filters
    const where = buildOrderWhere(query);
    const { include: orderRoleInclude } = buildRoleWhereAndInclude(query);

    const include = [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Customer, as: "customer", attributes: [] },
      { ...orderRoleInclude, required: true, attributes: [] },
    ];

    const rows = await Order.findAll({
      where,
      include,
      attributes: [
        [Sequelize.col("user.id"), "userId"],
        [Sequelize.col("user.name"), "userName"],
        [Sequelize.fn("COUNT", Sequelize.col("Order.id")), "totalOrders"],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("Order.totalAmount")),
            0,
          ),
          "totalSales",
        ],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("AVG", Sequelize.col("Order.totalAmount")),
            0,
          ),
          "avgOrderValue",
        ],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("MAX", Sequelize.col("Order.totalAmount")),
            0,
          ),
          "maxOrderValue",
        ],
      ],
      group: [Sequelize.col("user.id"), Sequelize.col("user.name")],
      order: [[Sequelize.literal('"totalSales"'), "DESC"]],
      raw: true,
      subQuery: false,
    });

    return { data: rows };
  }

  static async totals(user, query = {}) {
    if (!["ADMIN", "MANAGER"].includes(String(user.role).toUpperCase())) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    const where = buildOrderWhere(query);
    const { include: orderRoleInclude } = buildRoleWhereAndInclude(query);

    const include = [
      { model: User, as: "user", attributes: [] },
      { model: Customer, as: "customer", attributes: [] },
      { ...orderRoleInclude, required: true, attributes: [] },
    ];

    const rows = await Order.findAll({
      where,
      include,
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.col("Order.id")), "totalOrders"],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("Order.totalAmount")),
            0,
          ),
          "totalSales",
        ],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn("SUM", Sequelize.col("Order.paidAmount")),
            0,
          ),
          "totalCollected",
        ],
        [
          Sequelize.fn(
            "COALESCE",
            Sequelize.fn(
              "SUM",
              Sequelize.literal(
                '("Order"."totalAmount" - COALESCE("Order"."paidAmount",0))',
              ),
            ),
            0,
          ),
          "totalDue",
        ],
      ],
      raw: true,
      subQuery: false,
    });

    return {
      data: rows?.[0] || {
        totalOrders: 0,
        totalSales: 0,
        totalCollected: 0,
        totalDue: 0,
      },
    };
  }
}

module.exports = ReportService;
