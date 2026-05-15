const { Op } = require("sequelize");
const {
  User,
  Customer,
  Visit,
  Order,
  Collection,
  Expense,
  Attendance,
  UserCustomerRole,
} = require("../models");

const PERIODS = new Set(["all", "30d", "7d", "today"]);

function normalizePeriod(period) {
  const value = String(period || "all").toLowerCase();
  return PERIODS.has(value) ? value : "all";
}

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseLocalDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();

  // Sequelize DATEONLY often comes as YYYY-MM-DD. Parse it as local date,
  // not UTC, so dashboard buckets do not shift by timezone.
  const isoDateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    return new Date(
      Number(isoDateOnly[1]),
      Number(isoDateOnly[2]) - 1,
      Number(isoDateOnly[3])
    );
  }

  // Supports browser-style date strings like 05/03/2026 if they appear.
  const slashDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    return new Date(
      Number(slashDate[3]),
      Number(slashDate[1]) - 1,
      Number(slashDate[2])
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateOnly(date) {
  const d = parseLocalDate(date) || new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function subtractDays(days) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - days);
  return d;
}

function getPeriodRange(period) {
  const safe = normalizePeriod(period);
  const now = new Date();

  if (safe === "today") {
    return {
      period: safe,
      label: "Today",
      start: startOfDay(now),
      end: endOfDay(now),
    };
  }

  if (safe === "7d") {
    return {
      period: safe,
      label: "Last 7 days",
      start: subtractDays(6),
      end: endOfDay(now),
    };
  }

  if (safe === "30d") {
    return {
      period: safe,
      label: "Last 30 days",
      start: subtractDays(29),
      end: endOfDay(now),
    };
  }

  return {
    period: "all",
    label: "All time",
    start: null,
    end: null,
  };
}

function pickField(model, candidates) {
  const attrs = model?.rawAttributes || {};
  return candidates.find((field) => !!attrs[field]) || null;
}

function getDateField(model, candidates = []) {
  return pickField(model, [
    ...candidates,
    "date",
    "plannedAt",
    "collectedAt",
    "incurredAt",
    "createdAt",
    "updatedAt",
  ]);
}

function buildPeriodWhere(model, periodRange, preferredFields = []) {
  const dateField = getDateField(model, preferredFields);
  if (!dateField || !periodRange?.start || !periodRange?.end) return {};

  const attr = model.rawAttributes?.[dateField];
  const typeKey = attr?.type?.key;

  if (typeKey === "DATEONLY") {
    return {
      [dateField]: {
        [Op.between]: [toDateOnly(periodRange.start), toDateOnly(periodRange.end)],
      },
    };
  }

  return {
    [dateField]: {
      [Op.between]: [periodRange.start, periodRange.end],
    },
  };
}

function buildUserWhere(model, user) {
  const userField = pickField(model, ["userId", "fieldUserId", "createdBy"]);
  if (!userField || !user?.id) return {};
  return { [userField]: String(user.id) };
}

function mergeWhere(...parts) {
  return Object.assign({}, ...parts.filter(Boolean));
}

function numberValue(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value) {
  return Math.round(numberValue(value) * 100) / 100;
}

function percent(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function dateKey(date) {
  const d = parseLocalDate(date);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function monthKey(date) {
  const d = parseLocalDate(date);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function rowDateKey(row, fields = []) {
  for (const field of fields) {
    const key = dateKey(row?.[field]);
    if (key) return key;
  }
  return "";
}

function rowMonthKey(row, fields = []) {
  for (const field of fields) {
    const key = monthKey(row?.[field]);
    if (key) return key;
  }
  return "";
}

function formatMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString("en", { month: "short", year: "2-digit" });
}

function makeDayBuckets(range) {
  const buckets = [];
  const current = startOfDay(range.start || new Date());
  const end = startOfDay(range.end || new Date());

  while (current <= end) {
    const key = dateKey(current);
    buckets.push({ key, label: current.toLocaleString("en", { month: "short", day: "numeric" }) });
    current.setDate(current.getDate() + 1);
  }

  return buckets;
}

function makeAllTimeMonthBuckets(rows, dateExtractor) {
  const keys = new Set();

  rows.forEach((row) => {
    const raw = dateExtractor(row);
    if (raw) keys.add(monthKey(raw));
  });

  const sorted = Array.from(keys).sort();
  if (sorted.length === 0) {
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      sorted.push(monthKey(d));
    }
  }

  return sorted.map((key) => ({ key, label: formatMonthLabel(key) }));
}

function groupStatus(rows, field, fallback = "UNKNOWN") {
  const map = new Map();
  rows.forEach((row) => {
    const key = String(row[field] || fallback).toUpperCase();
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function ensureSlices(items, fallbackLabels) {
  const map = new Map(items.map((item) => [item.label, item.value]));
  fallbackLabels.forEach((label) => {
    if (!map.has(label)) map.set(label, 0);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

async function countSafe(model, options = {}) {
  try {
    return await model.count(options);
  } catch {
    return 0;
  }
}

async function findAllSafe(model, options = {}) {
  try {
    return await model.findAll(options);
  } catch {
    return [];
  }
}

async function sumRows(model, field, where = {}) {
  try {
    const total = await model.sum(field, { where });
    return money(total);
  } catch {
    return 0;
  }
}

function plainRows(rows) {
  return rows.map((row) => (typeof row.toJSON === "function" ? row.toJSON() : row));
}

class DashboardService {
  static async getStats(user) {
    const role = String(user?.role || "").toUpperCase();
    const whereVisitUser = role === "FIELD" ? buildUserWhere(Visit, user) : {};
    const whereOrderUser = role === "FIELD" ? buildUserWhere(Order, user) : {};
    const whereCollectionUser = role === "FIELD" ? buildUserWhere(Collection, user) : {};
    const whereExpenseUser = role === "FIELD" ? buildUserWhere(Expense, user) : {};

    const todayRange = getPeriodRange("today");

    const [totalVisits, totalOrders, totalCollections, totalExpenses] = await Promise.all([
      countSafe(Visit, { where: whereVisitUser }),
      countSafe(Order, { where: whereOrderUser }),
      countSafe(Collection, { where: whereCollectionUser }),
      countSafe(Expense, { where: whereExpenseUser }),
    ]);

    let totalCustomers = 0;
    try {
      if (role === "FIELD") {
        totalCustomers = await UserCustomerRole.count({
          distinct: true,
          col: "customerId",
          where: { userId: String(user.id) },
        });
      } else {
        totalCustomers = await Customer.count();
      }
    } catch {
      totalCustomers = 0;
    }

    const [totalVisitsToday, totalOrdersToday, totalCollectionsToday] = await Promise.all([
      countSafe(Visit, { where: mergeWhere(whereVisitUser, buildPeriodWhere(Visit, todayRange, ["plannedAt"])) }),
      countSafe(Order, { where: mergeWhere(whereOrderUser, buildPeriodWhere(Order, todayRange, ["date"])) }),
      countSafe(Collection, { where: mergeWhere(whereCollectionUser, buildPeriodWhere(Collection, todayRange, ["collectedAt"])) }),
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

  static async getAnalytics(user, periodParam = "all") {
    const role = String(user?.role || "").toUpperCase();
    const range = getPeriodRange(periodParam);
    const isField = role === "FIELD";

    const userOrderWhere = isField ? buildUserWhere(Order, user) : {};
    const userVisitWhere = isField ? buildUserWhere(Visit, user) : {};
    const userCollectionWhere = isField ? buildUserWhere(Collection, user) : {};
    const userExpenseWhere = isField ? buildUserWhere(Expense, user) : {};
    const userAttendanceWhere = isField ? buildUserWhere(Attendance, user) : {};

    const orderWhere = mergeWhere(userOrderWhere, buildPeriodWhere(Order, range, ["date"]));
    const visitWhere = mergeWhere(userVisitWhere, buildPeriodWhere(Visit, range, ["plannedAt"]));
    const collectionWhere = mergeWhere(userCollectionWhere, buildPeriodWhere(Collection, range, ["collectedAt"]));
    const expenseWhere = mergeWhere(userExpenseWhere, buildPeriodWhere(Expense, range, ["incurredAt"]));
    const attendanceWhere = mergeWhere(userAttendanceWhere, buildPeriodWhere(Attendance, range, ["date"]));

    const userWhere = range.period === "all" ? {} : buildPeriodWhere(User, range, ["createdAt"]);
    const customerWhere = range.period === "all" ? {} : buildPeriodWhere(Customer, range, ["createdAt"]);

    const [
      totalUsers,
      totalCustomers,
      totalVisits,
      totalOrders,
      totalCollections,
      totalExpenses,
      totalAttendance,
      totalRevenue,
      requestRevenue,
      totalCollected,
      approvedCollected,
      totalExpenseAmount,
      approvedExpenseAmount,
      ordersRaw,
      visitsRaw,
      collectionsRaw,
      expensesRaw,
      recentOrdersRaw,
    ] = await Promise.all([
      isField ? Promise.resolve(0) : countSafe(User, { where: userWhere }),
      isField
        ? UserCustomerRole.count({ distinct: true, col: "customerId", where: { userId: String(user.id) } }).catch(() => 0)
        : countSafe(Customer, { where: customerWhere }),
      countSafe(Visit, { where: visitWhere }),
      countSafe(Order, { where: orderWhere }),
      countSafe(Collection, { where: collectionWhere }),
      countSafe(Expense, { where: expenseWhere }),
      countSafe(Attendance, { where: attendanceWhere }),
      sumRows(Order, "totalAmount", orderWhere),
      sumRows(Order, "requestTotalAmount", orderWhere),
      sumRows(Collection, "amount", collectionWhere),
      sumRows(Collection, "amount", mergeWhere(collectionWhere, { status: "APPROVED" })),
      sumRows(Expense, "amount", expenseWhere),
      sumRows(Expense, "amount", mergeWhere(expenseWhere, { status: "APPROVED" })),
      findAllSafe(Order, {
        where: orderWhere,
        attributes: ["id", "orderNumber", "date", "totalAmount", "requestTotalAmount", "paidAmount", "paymentStatus", "status", "userId", "customerId", "createdAt"],
        raw: true,
      }),
      findAllSafe(Visit, {
        where: visitWhere,
        attributes: ["id", "plannedAt", "status", "userId", "customerId", "createdAt"],
        raw: true,
      }),
      findAllSafe(Collection, {
        where: collectionWhere,
        attributes: ["id", "amount", "status", "paymentType", "collectedAt", "userId", "createdAt"],
        raw: true,
      }),
      findAllSafe(Expense, {
        where: expenseWhere,
        attributes: ["id", "amount", "category", "status", "incurredAt", "userId", "createdAt"],
        raw: true,
      }),
      findAllSafe(Order, {
        where: orderWhere,
        attributes: ["id", "orderNumber", "date", "totalAmount", "paidAmount", "paymentStatus", "status", "userId", "customerId", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 8,
        raw: true,
      }),
    ]);

    const orders = plainRows(ordersRaw);
    const visits = plainRows(visitsRaw);
    const collections = plainRows(collectionsRaw);
    const expenses = plainRows(expensesRaw);

    const safeRevenue = totalRevenue || requestRevenue;

    const buckets = range.period === "all"
      ? makeAllTimeMonthBuckets(orders, (row) => row.date || row.createdAt)
      : makeDayBuckets(range);

    let trend = buckets.map((bucket) => {
      const isMonth = range.period === "all";

      const ordersInBucket = orders.filter((row) => {
        const key = isMonth
          ? rowMonthKey(row, ["date", "createdAt"])
          : rowDateKey(row, ["date", "createdAt"]);
        return key === bucket.key;
      });

      const visitsInBucket = visits.filter((row) => {
        const key = isMonth
          ? rowMonthKey(row, ["plannedAt", "createdAt"])
          : rowDateKey(row, ["plannedAt", "createdAt"]);
        return key === bucket.key;
      });

      const collectionsInBucket = collections.filter((row) => {
        const key = isMonth
          ? rowMonthKey(row, ["collectedAt", "createdAt"])
          : rowDateKey(row, ["collectedAt", "createdAt"]);
        return key === bucket.key;
      });

      const expensesInBucket = expenses.filter((row) => {
        const key = isMonth
          ? rowMonthKey(row, ["incurredAt", "createdAt"])
          : rowDateKey(row, ["incurredAt", "createdAt"]);
        return key === bucket.key;
      });

      return {
        label: bucket.label,
        key: bucket.key,
        orders: ordersInBucket.length,
        visits: visitsInBucket.length,
        revenue: money(ordersInBucket.reduce((sum, row) => sum + numberValue(row.totalAmount || row.requestTotalAmount), 0)),
        collections: money(collectionsInBucket.reduce((sum, row) => sum + numberValue(row.amount), 0)),
        expenses: money(expensesInBucket.reduce((sum, row) => sum + numberValue(row.amount), 0)),
      };
    });

    // Safety fallback: if the period totals include revenue but date bucketing found zero,
    // still show the chart for Today / Last 7 days instead of an empty graph.
    const trendRevenueTotal = trend.reduce((sum, row) => sum + numberValue(row.revenue), 0);
    if (safeRevenue > 0 && trendRevenueTotal <= 0 && trend.length) {
      const targetIndex = range.period === "today" ? trend.length - 1 : trend.length - 1;
      trend[targetIndex] = {
        ...trend[targetIndex],
        revenue: money(safeRevenue),
        orders: Math.max(trend[targetIndex].orders, totalOrders),
      };
    }

    const completedOrders = orders.filter((row) => String(row.status || "").toUpperCase() === "COMPLETED").length;
    const pendingOrders = orders.filter((row) => String(row.status || "").toUpperCase() === "PENDING").length;
    const completedVisits = visits.filter((row) => String(row.status || "").toUpperCase() === "COMPLETED").length;
    const approvedCollections = collections.filter((row) => String(row.status || "").toUpperCase() === "APPROVED").length;
    const approvedExpenses = expenses.filter((row) => String(row.status || "").toUpperCase() === "APPROVED").length;

    const collectionRate = safeRevenue > 0 ? percent((totalCollected / safeRevenue) * 100) : 0;
    const orderCompletionRate = totalOrders > 0 ? percent((completedOrders / totalOrders) * 100) : 0;
    const visitCompletionRate = totalVisits > 0 ? percent((completedVisits / totalVisits) * 100) : 0;
    const expenseApprovalRate = totalExpenses > 0 ? percent((approvedExpenses / totalExpenses) * 100) : 0;

    let topPerformers = [];
    if (!isField) {
      const userIds = Array.from(new Set([
        ...orders.map((row) => row.userId).filter(Boolean),
        ...collections.map((row) => row.userId).filter(Boolean),
      ]));
      const users = await findAllSafe(User, {
        where: userIds.length ? { id: { [Op.in]: userIds } } : {},
        attributes: ["id", "name", "email", "role"],
        raw: true,
      });
      const userMap = new Map(users.map((u) => [String(u.id), u]));
      const perf = new Map();

      userIds.forEach((id) => {
        const userInfo = userMap.get(String(id)) || {};
        perf.set(String(id), {
          id: String(id),
          name: userInfo.name || userInfo.email || "Field user",
          role: userInfo.role || "FIELD",
          orders: 0,
          revenue: 0,
          collections: 0,
        });
      });

      orders.forEach((row) => {
        if (!row.userId || !perf.has(String(row.userId))) return;
        const item = perf.get(String(row.userId));
        item.orders += 1;
        item.revenue += numberValue(row.totalAmount || row.requestTotalAmount);
      });

      collections.forEach((row) => {
        if (!row.userId || !perf.has(String(row.userId))) return;
        const item = perf.get(String(row.userId));
        item.collections += numberValue(row.amount);
      });

      topPerformers = Array.from(perf.values())
        .map((item) => {
          const revenue = money(item.revenue);
          const collections = money(item.collections);
          return {
            ...item,
            revenue,
            collections,
            // Do not add revenue + collection because fully paid orders would look doubled.
            // Contribution is the business value for ranking/display.
            contribution: Math.max(revenue, collections),
          };
        })
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 5);
    }

    const recentCustomerIds = Array.from(new Set(plainRows(recentOrdersRaw).map((row) => row.customerId).filter(Boolean)));
    const recentCustomers = await findAllSafe(Customer, {
      where: recentCustomerIds.length ? { id: { [Op.in]: recentCustomerIds } } : {},
      attributes: ["id", "name"],
      raw: true,
    });
    const recentCustomerMap = new Map(recentCustomers.map((customer) => [String(customer.id), customer.name]));

    return {
      period: range.period,
      periodLabel: range.label,
      role,
      overview: {
        totalUsers,
        totalCustomers,
        totalVisits,
        totalOrders,
        totalCollections,
        totalExpenses,
        totalAttendance,
        completedOrders,
        pendingOrders,
        completedVisits,
        approvedCollections,
        approvedExpenses,
      },
      finance: {
        totalRevenue: safeRevenue,
        requestedRevenue: requestRevenue,
        totalCollected,
        approvedCollected,
        totalExpenseAmount,
        approvedExpenseAmount,
        netCollection: money(totalCollected - totalExpenseAmount),
        collectionRate,
        orderCompletionRate,
        visitCompletionRate,
        expenseApprovalRate,
      },
      charts: {
        trend,
        orderStatus: ensureSlices(groupStatus(orders, "status"), ["PENDING", "COMPLETED", "CANCELLED"]),
        orderPaymentStatus: ensureSlices(groupStatus(orders, "paymentStatus"), ["UNPAID", "PARTIAL", "PAID"]),
        collectionStatus: ensureSlices(groupStatus(collections, "status"), ["PENDING", "APPROVED", "REJECTED"]),
        expenseStatus: ensureSlices(groupStatus(expenses, "status"), ["PENDING", "APPROVED", "REJECTED"]),
        topPerformers,
      },
      recentOrders: plainRows(recentOrdersRaw).map((row) => ({
        id: row.id,
        orderNumber: row.orderNumber,
        date: row.date,
        customerName: recentCustomerMap.get(String(row.customerId)) || "Customer",
        amount: money(row.totalAmount || row.requestTotalAmount),
        totalAmount: money(row.totalAmount || row.requestTotalAmount),
        paidAmount: money(row.paidAmount),
        paymentStatus: row.paymentStatus,
        status: row.status,
      })),
    };
  }
}

module.exports = DashboardService;
