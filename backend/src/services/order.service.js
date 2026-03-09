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

    const getMaxExisting = async () => {
      const last = await Order.findOne({
        where: { orderNumber: { [Op.like]: `${prefix}%` } },
        attributes: ["orderNumber"],
        order: [["orderNumber", "DESC"]],
        transaction: t,
      });

      if (!last?.orderNumber) return 0;
      const tail = String(last.orderNumber).slice(prefix.length);
      const n = parseInt(tail, 10);
      return Number.isFinite(n) ? n : 0;
    };

    let counter = await OrderCounter.findOne({
      where: { year },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const maxExisting = await getMaxExisting();

    if (!counter) {
      try {
        counter = await OrderCounter.create({ year, lastNumber: maxExisting }, { transaction: t });
      } catch (e) {
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

  static _isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  static _normalizeItems(items, actorRole = "FIELD", isEdit = false) {
    if (!Array.isArray(items) || items.length === 0) {
      throw this._badRequest("Order items are required");
    }

    const canApprove = ["ADMIN", "MANAGER"].includes(String(actorRole || "").toUpperCase());

    return items.map((it) => {
      const id = it.id ? String(it.id).trim() : null;
      const productId = String(it.productId || "").trim();
      const quantity = Number(it.quantity);
      const price = Number(it.price);
      const rawApproved = it.approvedQuantity;

      let approvedQuantity;
      if (rawApproved === undefined || rawApproved === null || rawApproved === "") {
        // Professional rule:
        // create order => no stock reduction until approved
        // so default approved qty = 0
        approvedQuantity = 0;
      } else {
        approvedQuantity = Number(rawApproved);
      }

      if (id && !this._isNonEmptyString(id)) {
        throw this._badRequest("Invalid item id");
      }
      if (!this._isNonEmptyString(productId)) {
        throw this._badRequest("Invalid productId in items");
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw this._badRequest("Quantity must be greater than 0");
      }
      if (!Number.isFinite(price) || price < 0) {
        throw this._badRequest("Price cannot be negative");
      }
      if (!Number.isFinite(approvedQuantity) || approvedQuantity < 0) {
        throw this._badRequest("Approved quantity cannot be negative");
      }
      if (approvedQuantity > quantity) {
        throw this._badRequest("Approved quantity cannot be greater than requested quantity");
      }

      // FIELD users cannot approve. They can request only.
      if (!canApprove && rawApproved !== undefined && rawApproved !== null && Number(rawApproved) !== 0) {
        throw this._forbidden("Only ADMIN or MANAGER can set approved quantity");
      }

      return {
        id,
        productId,
        quantity,
        approvedQuantity,
        price,
      };
    });
  }

  static _calcRequestedTotal(items) {
    return items.reduce((sum, it) => sum + it.price * (it.quantity ?? 0), 0);
  }

  static _calcTotal(items) {
    return items.reduce((sum, it) => sum + it.price * (it.approvedQuantity ?? 0), 0);
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
    if (query.status) where.status = String(query.status).toUpperCase();
    if (query.customerId) where.customerId = String(query.customerId);
    if (query.userId) where.userId = String(query.userId);

    const fromDate = query.fromDate || query.from || null;
    const toDate = query.toDate || query.to || null;

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date[Op.gte] = fromDate;
      if (toDate) where.date[Op.lte] = toDate;
    }

    if (user.role === "FIELD") where.userId = String(user.id);

    const q = String(query.q || "").trim();
    if (q) {
      const like = `%${q}%`;
      where[Op.or] = [
        Sequelize.where(Sequelize.cast(Sequelize.col("Order.id"), "text"), { [Op.iLike]: like }),
        { "$customer.name$": { [Op.iLike]: like } },
        { "$customer.phone$": { [Op.iLike]: like } },
        { "$user.name$": { [Op.iLike]: like } },
        { notes: { [Op.iLike]: like } },
      ];
    }

    const roleWhere = {};
    let roleFilterOn = false;
    ["companyId", "region", "area", "territory", "parentId", "role"].forEach((k) => {
      if (query[k]) {
        roleWhere[k] = String(query[k]);
        roleFilterOn = true;
      }
    });

    const include = [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
      { model: UserOrderRole, as: "orderRole", required: roleFilterOn, where: roleFilterOn ? roleWhere : undefined },
      {
        model: OrderItem,
        as: "items",
        required: false,
        attributes: ["id", "quantity", "approvedQuantity", "price", "total", "productId"],
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

  static async getOrderById(user, id) {
    const order = await Order.findByPk(id, { include: this._orderIncludes() });
    if (!order) throw this._notFound("Order not found");
    if (user.role === "FIELD" && String(order.userId) !== String(user.id)) {
      throw this._forbidden();
    }
    return order;
  }

  static async createOrder(user, payload = {}) {
    const orderData = payload.order || {};
    const items = this._normalizeItems(payload.items, user.role, false);

    const customerId = String(orderData.customerId || "").trim();
    if (!this._isNonEmptyString(customerId)) {
      throw this._badRequest("customerId is required");
    }

    const userId = user.role === "FIELD" ? String(user.id) : String(orderData.userId || user.id);
    const date = orderData.date || new Date().toISOString().slice(0, 10);
    const status = orderData.status || "PENDING";
    const notes = orderData.notes || "";
    const requestTotalAmount = this._calcRequestedTotal(items);
    const totalAmount = this._calcTotal(items);

    return await sequelize.transaction(async (t) => {
      // Only approved qty affects stock.
      // On create, if approved qty is 0, stock remains unchanged.
      for (const it of items) {
        const product = await Product.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!product) throw this._notFound(`Product not found: ${it.productId}`);
        if (product.stock < it.approvedQuantity) {
          throw this._badRequest(`Insufficient stock for product ${product.name}`);
        }
      }

      const orderNumber = await this._generateOrderNumber(t, date);
      const order = await Order.create(
        { orderNumber, userId, customerId, date, status, notes, requestTotalAmount, totalAmount },
        { transaction: t }
      );

      const dateStr = String(date);
      const ucr = await UserCustomerRole.findOne({
        where: { userId, customerId, ...this._activeOnWhere(dateStr) },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
        lock: t.LOCK.KEY_SHARE,
      });

      if (!ucr) {
        throw this._badRequest("No active customer assignment found for this user on the order date. Please assign customer to user first.");
      }

      const uc = await UserCompany.findOne({
        where: { userId, companyId: ucr.companyId, ...this._activeOnWhere(dateStr) },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
        lock: t.LOCK.KEY_SHARE,
      });

      if (!uc) {
        throw this._badRequest("User has no active company assignment for this company on the order date. Please assign user to company first.");
      }

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
        { transaction: t }
      );

      for (const it of items) {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: it.productId,
            quantity: it.quantity,
            approvedQuantity: it.approvedQuantity,
            price: it.price,
            total: it.price * it.approvedQuantity,
          },
          { transaction: t }
        );

        if (it.approvedQuantity > 0) {
          await Product.increment(
            { stock: -it.approvedQuantity },
            { where: { id: it.productId }, transaction: t }
          );
        }
      }

      return await Order.findByPk(order.id, { transaction: t, include: this._orderIncludes() });
    });
  }

  static async updateOrder(user, orderId, payload = {}) {
    const orderData = payload.order || {};
    let items = this._normalizeItems(payload.items, user.role, true);

    return await sequelize.transaction(async (t) => {
      // 1) Lock parent order ONLY
      const order = await Order.findByPk(orderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) throw this._notFound("Order not found");

      if (String(user.role).toUpperCase() === "FIELD" && String(order.userId) !== String(user.id)) {
        throw this._forbidden("You can update only your own orders");
      }

      const canApprove = ["ADMIN", "MANAGER"].includes(String(user.role || "").toUpperCase());

      // 2) Lock child items separately
      const oldItems = await OrderItem.findAll({
        where: { orderId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const oldItemsMap = new Map(oldItems.map((item) => [String(item.id), item]));

      // Validate incoming item ids belong to this order
      for (const it of items) {
        if (it.id && !oldItemsMap.has(String(it.id))) {
          throw this._badRequest(`Invalid order item id: ${it.id}`);
        }
      }

      // FIELD cannot change approvals.
      // Preserve existing approval on existing lines, and default new lines to 0 approval.
      if (!canApprove) {
        items = items.map((it) => {
          if (it.id && oldItemsMap.has(String(it.id))) {
            const old = oldItemsMap.get(String(it.id));
            return {
              ...it,
              approvedQuantity: Number(old.approvedQuantity ?? 0),
            };
          }
          return {
            ...it,
            approvedQuantity: 0,
          };
        });
      }

      // Revalidate after approval normalization
      for (const it of items) {
        if (it.approvedQuantity > it.quantity) {
          throw this._badRequest("Approved quantity cannot be greater than requested quantity");
        }
      }

      // 3) Lock all related products separately
      const productIds = [
        ...new Set([
          ...oldItems.map((it) => String(it.productId)),
          ...items.map((it) => String(it.productId)),
        ]),
      ];

      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const productMap = new Map(products.map((p) => [String(p.id), p]));

      // Validate product existence
      for (const pid of productIds) {
        if (!productMap.has(String(pid))) {
          throw this._notFound(`Product not found: ${pid}`);
        }
      }

      // 4) Professional stock calculation:
      // current DB stock + old approved qty restored - new approved qty deducted
      const stockAfterRestore = new Map();
      for (const product of products) {
        stockAfterRestore.set(String(product.id), Number(product.stock || 0));
      }

      for (const oldItem of oldItems) {
        const pid = String(oldItem.productId);
        const current = stockAfterRestore.get(pid) || 0;
        stockAfterRestore.set(
          pid,
          current + Number(oldItem.approvedQuantity ?? 0)
        );
      }

      for (const it of items) {
        const pid = String(it.productId);
        const available = stockAfterRestore.get(pid) || 0;
        if (available < Number(it.approvedQuantity || 0)) {
          const product = productMap.get(pid);
          throw this._badRequest(`Insufficient stock for product ${product?.name || pid}`);
        }
        stockAfterRestore.set(pid, available - Number(it.approvedQuantity || 0));
      }

      // 5) Persist final stock once per product
      for (const product of products) {
        const finalStock = stockAfterRestore.get(String(product.id));
        product.stock = Number(finalStock || 0);
        await product.save({ transaction: t });
      }

      // 6) Update/create/delete order items
      let requestTotalAmount = 0;
      let totalAmount = 0;
      const seenIncomingIds = new Set();

      for (const it of items) {
        const lineTotal = Number(it.price) * Number(it.approvedQuantity || 0);

        if (it.id) {
          const existingItem = oldItemsMap.get(String(it.id));
          seenIncomingIds.add(String(it.id));

          await existingItem.update(
            {
              productId: it.productId,
              quantity: it.quantity,
              approvedQuantity: it.approvedQuantity,
              price: it.price,
              total: lineTotal,
            },
            { transaction: t }
          );
        } else {
          await OrderItem.create(
            {
              orderId,
              productId: it.productId,
              quantity: it.quantity,
              approvedQuantity: it.approvedQuantity,
              price: it.price,
              total: lineTotal,
            },
            { transaction: t }
          );
        }

        requestTotalAmount += Number(it.price) * Number(it.quantity || 0);
        totalAmount += lineTotal;
      }

      for (const oldItem of oldItems) {
        if (!seenIncomingIds.has(String(oldItem.id))) {
          await oldItem.destroy({ transaction: t });
        }
      }

      // 7) Update order header
      order.date = orderData.date || order.date;
      order.status = orderData.status || order.status;
      order.notes = orderData.notes ?? order.notes;
      order.requestTotalAmount = requestTotalAmount;
      order.totalAmount = totalAmount;
      if (orderData.customerId) order.customerId = String(orderData.customerId);
      await order.save({ transaction: t });

      // 8) Update role snapshot
      const dateStr = String(order.date);
      const effectiveUserId = String(order.userId);
      const effectiveCustomerId = String(order.customerId);

      const ucr = await UserCustomerRole.findOne({
        where: { userId: effectiveUserId, customerId: effectiveCustomerId, ...this._activeOnWhere(dateStr) },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
      });

      if (!ucr) {
        throw this._badRequest("No active customer assignment found for this user on the order date (after update).");
      }

      const uc = await UserCompany.findOne({
        where: { userId: effectiveUserId, companyId: ucr.companyId, ...this._activeOnWhere(dateStr) },
        order: [["effectiveFrom", "DESC"]],
        transaction: t,
      });

      if (!uc) {
        throw this._badRequest("User has no active company assignment for this company on the order date (after update).");
      }

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

      return await Order.findByPk(orderId, {
        transaction: t,
        include: this._orderIncludes(),
      });
    });
  }

  static async deleteOrder(user, orderId) {
    if (user.role === "FIELD") throw this._forbidden("FIELD user cannot delete orders");

    return await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!order) throw this._notFound("Order not found");

      const items = await OrderItem.findAll({
        where: { orderId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const productIds = [...new Set(items.map((it) => String(it.productId)))];
      const products = await Product.findAll({
        where: { id: { [Op.in]: productIds } },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const productMap = new Map(products.map((p) => [String(p.id), p]));

      for (const item of items) {
        const product = productMap.get(String(item.productId));
        if (product) {
          product.stock += Number(item.approvedQuantity ?? 0);
          await product.save({ transaction: t });
        }
      }

      for (const item of items) {
        await item.destroy({ transaction: t });
      }

      await order.destroy({ transaction: t });
      return { message: "Order deleted successfully" };
    });
  }

  static async getOpenOrdersForCollection(user, query = {}) {
    const customerId = String(query.customerId || "").trim();
    if (!customerId) throw this._badRequest("customerId is required");

    const where = { customerId };
    if (user.role === "FIELD") where.userId = String(user.id);

    const orders = await Order.findAll({
      where,
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
        { model: User, as: "user", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

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