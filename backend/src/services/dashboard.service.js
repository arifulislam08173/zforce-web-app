const { Op } = require("sequelize");
const { Visit, Order, Collection, Expense } = require("../models");

function pickField(model, candidates) {
  const attrs = model?.rawAttributes || {};
  return candidates.find((c) => !!attrs[c]) || null;
}

function buildWhereForUser(model, user) {
  const userField = pickField(model, ["userId", "createdBy", "fieldUserId"]);
  if (!userField) return {};
  return { [userField]: String(user.id) };
}

function buildTodayWhere(model) {
  const dateField = pickField(model, [
    "date",
    "visitDate",
    "orderDate",
    "collectionDate",
    "expenseDate",
    "createdAt",
    "updatedAt",
  ]);

  if (!dateField) return {}; // no date filtering possible

  const attr = model.rawAttributes[dateField];
  const typeKey = attr?.type?.key;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  // If DATEONLY column -> compare with YYYY-MM-DD
  if (typeKey === "DATEONLY") {
    const today = now.toISOString().slice(0, 10);
    return { [dateField]: { [Op.eq]: today } };
  }

  // timestamp/date -> compare with start/end range
  return { [dateField]: { [Op.between]: [start, end] } };
}

class DashboardService {
  static async getStats(user) {
    const role = String(user?.role || "").toUpperCase();
    const whereVisitUser = role === "FIELD" ? buildWhereForUser(Visit, user) : {};
    const whereOrderUser = role === "FIELD" ? buildWhereForUser(Order, user) : {};
    const whereCollectionUser = role === "FIELD" ? buildWhereForUser(Collection, user) : {};
    const whereExpenseUser = role === "FIELD" ? buildWhereForUser(Expense, user) : {};

    const [totalVisits, totalOrders, totalCollections, totalExpenses] =
      await Promise.all([
        Visit.count({ where: whereVisitUser }),
        Order.count({ where: whereOrderUser }),
        Collection.count({ where: whereCollectionUser }),
        Expense.count({ where: whereExpenseUser }),
      ]);

    // Customers: assigned via UserCustomerRole
    let totalCustomers = 0;
    try {
      const { UserCustomerRole } = require("../models");
      totalCustomers = await UserCustomerRole.count({
        distinct: true,
        col: "customerId",
        where: { userId: String(user.id) },
      });
    } catch {
      totalCustomers = 0;
    }

    // ✅ TODAY stats (uses correct date field automatically)
    const whereVisitToday = { ...whereVisitUser, ...buildTodayWhere(Visit) };
    const whereOrderToday = { ...whereOrderUser, ...buildTodayWhere(Order) };
    const whereCollectionToday = { ...whereCollectionUser, ...buildTodayWhere(Collection) };

    const [totalVisitsToday, totalOrdersToday, totalCollectionsToday] =
      await Promise.all([
        Visit.count({ where: whereVisitToday }),
        Order.count({ where: whereOrderToday }),
        Collection.count({ where: whereCollectionToday }),
      ]);

    return {
      totalCustomers,
      totalVisits,
      totalOrders,
      totalCollections,
      totalExpenses,
      totalVisitsToday,
      totalOrdersToday,
      totalCollectionsToday,
    };
  }
}

module.exports = DashboardService;