const { Op, Sequelize } = require("sequelize");
const {
  sequelize,
  Order,
  OrderItem,
  Product,
  User,
  Customer,
  OrderCounter,
  UserCustomerRole,
  UserCompany,
  UserOrderRole,
} = require("../models");

class OrderService {
  /**
   * helpers
   */

  static _activeOnWhere(dateStr) {
    return {
      effectiveFrom: { [Op.lte]: dateStr },
      [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: dateStr } }],
    };
  }

  static _pad6(n) {
    return String(n).padStart(6, "0");
  }

  static async _generateOrderNumber(t, orderDate) {
    const year = new Date(orderDate || Date.now()).getFullYear();
    const prefix = `ZF-${year}-`;

    // helper: existing orders
    const getMaxExisting = async () => {
      const last = await Order.findOne({
        where: {
          orderNumber: { [Op.like]: `${prefix}%` },
        },
        attributes: ["orderNumber"],
        order: [["orderNumber", "DESC"]],
        transaction: t,
      });

      if (!last?.orderNumber) return 0;

      const tail = String(last.orderNumber).slice(prefix.length); // "000123"
      const n = parseInt(tail, 10);
      return Number.isFinite(n) ? n : 0;
    };

    // counter row lock
    let counter = await OrderCounter.findOne({
      where: { year },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const maxExisting = await getMaxExisting();

    if (!counter) {
      try {
        counter = await OrderCounter.create(
          { year, lastNumber: maxExisting },
          { transaction: t },
        );
      } catch (e) {
        // race condition
        counter = await OrderCounter.findOne({
          where: { year },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }
    }

    if (counter.lastNumber < maxExisting) {
      counter.lastNumber = maxExisting;
      await counter.save({ transaction: t });
    }

    // next number
    counter.lastNumber += 1;
    await counter.save({ transaction: t });

    return `ZF-${year}-${this._pad6(counter.lastNumber)}`;
  }

  static _badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
  }

  static _notFound(message) {
    const err = new Error(message);
    err.status = 404;
    return err;
  }

  static _forbidden(message = "Forbidden") {
    const err = new Error(message);
    err.status = 403;
    return err;
  }

  // UUID-safe check
  static _isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  static _normalizeItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw this._badRequest("Order items are required");
    }

    return items.map((it) => {
      const productId = String(it.productId || "").trim(); // keep as string (UUID)
      const quantity = Number(it.quantity);
      const price = Number(it.price);

      if (!this._isNonEmptyString(productId)) {
        throw this._badRequest("Invalid productId in items");
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw this._badRequest("Quantity must be greater than 0");
      }
      if (!Number.isFinite(price) || price < 0) {
        throw this._badRequest("Price cannot be negative");
      }

      return { productId, quantity, price };
    });
  }

  static _calcTotal(items) {
    return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }

  static _orderIncludes() {
    return [
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Product, as: "product" }],
      },
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
      { model: UserOrderRole, as: "orderRole" },
    ];
  }

  static async getOrders(user, query = {}) {
    const page = Math.max(parseInt(query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 100);
    const offset = (page - 1) * limit;

    const where = {};

    // status filter
    if (query.status) where.status = String(query.status).toUpperCase();

    // exact filters
    if (query.customerId) where.customerId = String(query.customerId);
    if (query.userId) where.userId = String(query.userId);

    // date range (support BOTH naming styles)
    const fromDate = query.fromDate || query.from || null;
    const toDate = query.toDate || query.to || null;

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date[Op.gte] = fromDate; // "YYYY-MM-DD"
      if (toDate) where.date[Op.lte] = toDate; // "YYYY-MM-DD"
    }

    // FIELD sees only own orders
    if (user.role === "FIELD") {
      where.userId = String(user.id);
    }

    // SEARCH q (backend-controlled)
    const q = String(query.q || "").trim();
    if (q) {
      const like = `%${q}%`;

      where[Op.or] = [
        // Order ID (UUID) - cast to text for ILIKE
        Sequelize.where(Sequelize.cast(Sequelize.col("Order.id"), "text"), {
          [Op.iLike]: like,
        }),

        // Customer name / phone
        { "$customer.name$": { [Op.iLike]: like } },
        { "$customer.phone$": { [Op.iLike]: like } },

        // User name
        { "$user.name$": { [Op.iLike]: like } },

        // Optional: notes search (if you want)
        { notes: { [Op.iLike]: like } },
      ];
    }

    // const include = [
    //   { model: User, as: "user", attributes: ["id", "name", "email"] },
    //   { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
    // ];

    // ===== Role-based filters (from UserOrderRole) =====
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

    const include = [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
      {
        model: UserOrderRole,
        as: "orderRole",
        required: roleFilterOn, // important
        where: roleFilterOn ? roleWhere : undefined,
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
   * GET ONE
   */
  static async getOrderById(user, id) {
    const order = await Order.findByPk(id, { include: this._orderIncludes() });
    if (!order) throw this._notFound("Order not found");

    if (user.role === "FIELD" && String(order.userId) !== String(user.id)) {
      throw this._forbidden();
    }

    return order;
  }

  /**
   * CREATE
   */
  static async createOrder(user, payload = {}) {
    const orderData = payload.order || {};
    const items = this._normalizeItems(payload.items);

    const customerId = String(orderData.customerId || "").trim(); // UUID string
    if (!this._isNonEmptyString(customerId)) {
      throw this._badRequest("customerId is required");
    }

    // FIELD forced userId
    const userId =
      user.role === "FIELD"
        ? String(user.id)
        : String(orderData.userId || user.id);

    const date = orderData.date || new Date().toISOString().slice(0, 10);
    const status = orderData.status || "PENDING";
    const notes = orderData.notes || "";

    const totalAmount = this._calcTotal(items);

    return await sequelize.transaction(async (t) => {
      // validate stock with lock
      for (const it of items) {
        const product = await Product.findByPk(it.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!product)
          throw this._notFound(`Product not found: ${it.productId}`);
        if (product.stock < it.quantity) {
          throw this._badRequest(
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      const orderNumber = await this._generateOrderNumber(t, date);

      const order = await Order.create(
        { orderNumber, userId, customerId, date, status, notes, totalAmount },
        { transaction: t },
      );

      // ===== SNAPSHOT: UserOrderRole insert (after Order.create, before items loop) =====
      const dateStr = String(date);

      // 1) Find active assignment for this user + customer on order date
      const ucr = await UserCustomerRole.findOne({
        where: {
          userId,
          customerId,
          ...this._activeOnWhere(dateStr),
        },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
        lock: t.LOCK.KEY_SHARE,
      });

      if (!ucr) {
        throw this._badRequest(
          "No active customer assignment found for this user on the order date. Please assign customer to user first.",
        );
      }

      // 2) Ensure user has active company mapping for that company on that date
      const uc = await UserCompany.findOne({
        where: {
          userId,
          companyId: ucr.companyId,
          ...this._activeOnWhere(dateStr),
        },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
        lock: t.LOCK.KEY_SHARE,
      });

      if (!uc) {
        throw this._badRequest(
          "User has no active company assignment for this company on the order date. Please assign user to company first.",
        );
      }

      // 3) Create snapshot row
      await UserOrderRole.create(
        {
          orderId: order.id,
          userId,
          customerId,
          companyId: ucr.companyId,
          region: ucr.region,
          area: ucr.area,
          territory: ucr.territory,
          parentId: ucr.parentId,
          role: ucr.role || user.role,
        },
        { transaction: t },
      );
      // ===== END SNAPSHOT =====

      for (const it of items) {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
            total: it.price * it.quantity,
          },
          { transaction: t },
        );

        await Product.increment(
          { stock: -it.quantity },
          { where: { id: it.productId }, transaction: t },
        );
      }

      return await Order.findByPk(order.id, {
        transaction: t,
        include: this._orderIncludes(),
      });
    });
  }

  /**
   * UPDATE
   */
  static async updateOrder(user, orderId, payload = {}) {
    const orderData = payload.order || {};
    const items = this._normalizeItems(payload.items);

    return await sequelize.transaction(async (t) => {
      // lock ONLY the order row (no include)
      const order = await Order.findByPk(orderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) throw this._notFound("Order not found");

      // FIELD can update ONLY own order
      if (
        String(user.role).toUpperCase() === "FIELD" &&
        String(order.userId) !== String(user.id)
      ) {
        throw this._forbidden("You can update only your own orders");
      }

      // load old items
      const oldItems = await OrderItem.findAll({
        where: { orderId },
        transaction: t,
      });

      // Restore previous stock (lock each product)
      for (const oldItem of oldItems) {
        const product = await Product.findByPk(oldItem.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (product) {
          product.stock += oldItem.quantity;
          await product.save({ transaction: t });
        }
      }

      // Delete old items
      await OrderItem.destroy({ where: { orderId }, transaction: t });

      // Validate new items stock (lock each product)
      for (const it of items) {
        const product = await Product.findByPk(it.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!product)
          throw this._notFound(`Product not found: ${it.productId}`);
        if (product.stock < it.quantity) {
          throw this._badRequest(
            `Insufficient stock for product ${product.name}`,
          );
        }
      }

      // Create new items + deduct stock
      let totalAmount = 0;

      for (const it of items) {
        await OrderItem.create(
          {
            orderId,
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
            total: it.price * it.quantity,
          },
          { transaction: t },
        );

        await Product.increment(
          { stock: -it.quantity },
          { where: { id: it.productId }, transaction: t },
        );

        totalAmount += it.price * it.quantity;
      }

      // Update order fields
      order.date = orderData.date || order.date;
      order.status = orderData.status || order.status;
      order.notes = orderData.notes ?? order.notes;
      order.totalAmount = totalAmount;

      if (orderData.customerId) order.customerId = String(orderData.customerId);

      await order.save({ transaction: t });

      // ===== Update snapshot if key fields changed (recommended) =====
      const dateStr = String(order.date);
      const effectiveUserId = String(order.userId);
      const effectiveCustomerId = String(order.customerId);

      const ucr = await UserCustomerRole.findOne({
        where: {
          userId: effectiveUserId,
          customerId: effectiveCustomerId,
          ...this._activeOnWhere(dateStr),
        },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
      });

      if (!ucr) {
        throw this._badRequest(
          "No active customer assignment found for this user on the order date (after update).",
        );
      }

      // upsert orderRole row
      const existing = await UserOrderRole.findOne({
        where: { orderId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const snapshotPayload = {
        orderId,
        userId: effectiveUserId,
        customerId: effectiveCustomerId,
        companyId: ucr.companyId,
        region: ucr.region,
        area: ucr.area,
        territory: ucr.territory,
        parentId: ucr.parentId,
        role: ucr.role || user.role,
      };

      if (existing) await existing.update(snapshotPayload, { transaction: t });
      else await UserOrderRole.create(snapshotPayload, { transaction: t });
      // ===== END snapshot update =====

      // return updated order with includes
      return await Order.findByPk(orderId, {
        transaction: t,
        include: this._orderIncludes(),
      });
    });
  }

  /**
   * DELETE
   */
  static async deleteOrder(user, orderId) {
    if (user.role === "FIELD")
      throw this._forbidden("FIELD user cannot delete orders");

    return await sequelize.transaction(async (t) => {
      // Lock ONLY order row (no include -> no outer join lock error)
      const order = await Order.findByPk(orderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!order) throw this._notFound("Order not found");

      // Load items separately
      const items = await OrderItem.findAll({
        where: { orderId },
        transaction: t,
      });

      // Restore stock (lock each product)
      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (product) {
          product.stock += item.quantity;
          await product.save({ transaction: t });
        }
      }

      // Delete items then order
      await OrderItem.destroy({ where: { orderId }, transaction: t });
      await order.destroy({ transaction: t });

      return { message: "Order deleted successfully" };
    });
  }

  static async getOpenOrdersForCollection(user, query = {}) {
    const customerId = String(query.customerId || "").trim();
    if (!customerId) throw this._badRequest("customerId is required");

    const where = { customerId };

    // FIELD only their orders
    if (user.role === "FIELD") where.userId = String(user.id);

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["id", "name", "phone"],
        },
        { model: User, as: "user", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

    // compute due client-friendly
    return orders
      .map((o) => {
        const total = Number(o.totalAmount || 0);
        const paid = Number(o.paidAmount || 0);
        const due = Math.max(total - paid, 0);
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          date: o.date,
          status: o.status,
          totalAmount: total,
          paidAmount: paid,
          dueAmount: due,
          paymentStatus: o.paymentStatus,
          customer: o.customer,
          user: o.user,
        };
      })
      .filter((o) => o.dueAmount > 0);
  }
}

module.exports = OrderService;
