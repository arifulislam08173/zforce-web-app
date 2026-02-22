const { Order, Collection, Customer, User } = require("../models");

const calcPaymentStatus = (total, paidApproved) => {
  const t = Number(total || 0);
  const p = Number(paidApproved || 0);
  if (p <= 0) return "UNPAID";
  if (p >= t) return "PAID";
  return "PARTIAL";
};

exports.getOrderSummary = async (orderId, { transaction } = {}) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
      { model: User, as: "user", attributes: ["id", "name"] },
    ],
    transaction,
  });

  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    throw e;
  }

  const approved = await Collection.sum("amount", {
    where: { orderId, status: "APPROVED" },
    transaction,
  });

  const pending = await Collection.sum("amount", {
    where: { orderId, status: "PENDING" },
    transaction,
  });

  const total = Number(order.totalAmount || 0);
  const paidApproved = Number(approved || 0);
  const paidPending = Number(pending || 0);

  // Due used for “payment status”
  const dueApprovedOnly = Math.max(total - paidApproved, 0);

  const availableDue = Math.max(total - (paidApproved + paidPending), 0);

  const paymentStatus = calcPaymentStatus(total, paidApproved);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,

    total,
    due: dueApprovedOnly,

    orderTotal: total,
    paidApproved,
    paidPending,
    balanceDue: dueApprovedOnly,          // due after approved
    availableDue,                         // due remaining after approved+pending
    paymentStatus,

    order,
  };
};

exports.recomputeAndUpdateOrderPayment = async (orderId, transaction) => {
  const summary = await exports.getOrderSummary(orderId, { transaction });

  const order = await Order.findByPk(orderId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
  if (!order) {
    const e = new Error("Order not found");
    e.status = 404;
    throw e;
  }

  order.paidAmount = summary.paidApproved;
  order.paymentStatus = summary.paymentStatus;

  if (summary.paymentStatus === "PAID" && String(order.status).toUpperCase() === "PENDING") {
    order.status = "COMPLETED";
  }

  await order.save({ transaction });
  return summary;
};
