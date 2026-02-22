const OrderService = require("../services/order.service");
const { Order, OrderItem, Product, Customer, User, UserOrderRole, Company, Collection } = require("../models");
const { createInvoicePdf } = require("../utils/pdf.util");

exports.getOrders = async (req, res, next) => {
  try {
    const result = await OrderService.getOrders(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await OrderService.getOrderById(req.user, req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const created = await OrderService.createOrder(req.user, req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const updated = await OrderService.updateOrder(req.user, req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const result = await OrderService.deleteOrder(req.user, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};



exports.getOpenForCollection = async (req, res, next) => {
  try {
    const data = await OrderService.getOpenOrdersForCollection(req.user, req.query);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};



exports.downloadInvoicePdf = async (req, res, next) => {
  try {
    const id = req.params.id;

    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
        { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: UserOrderRole, as: "orderRole", attributes: ["companyId"] },
      ],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Role check: FIELD only own order
    if (req.user.role === "FIELD" && String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const companyId = order.orderRole?.companyId || null;
    const company = companyId ? await Company.findByPk(companyId) : null;

    const doc = createInvoicePdf({ order: order.toJSON(), company: company?.toJSON?.() || company });

    const filename = `invoice-${order.orderNumber || order.id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);
    doc.end();
  } catch (e) {
    next(e);
  }
};