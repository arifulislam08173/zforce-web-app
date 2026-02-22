const { Op } = require("sequelize");
const { sequelize, Attendance } = require("../models");

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const getToday = () => new Date().toISOString().split("T")[0];

const toDecOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Punch In
 * Creates attendance for the day
 */
exports.punchIn = async (userId, { lat, lng, photoPath } = {}) => {
  const t = await sequelize.transaction();

  try {
    const today = getToday();

    const existing = await Attendance.findOne({
      where: { userId, date: today },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (existing) {
      throw new Error("Already punched in for today");
    }

    const attendance = await Attendance.create(
      {
        userId,
        date: today,
        punchIn: new Date(),
        lat: toDecOrNull(lat),
        lng: toDecOrNull(lng),
        punchInPhoto: photoPath || null,
        status: "PRESENT",
      },
      { transaction: t }
    );

    await t.commit();
    return attendance;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Punch Out
 * Updates same row + saves outLat/outLng
 */
exports.punchOut = async (userId, { lat, lng, photoPath } = {}) => {
  const t = await sequelize.transaction();

  try {
    const today = getToday();

    const attendance = await Attendance.findOne({
      where: { userId, date: today },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!attendance) {
      throw new Error("Punch in required before punch out");
    }

    if (attendance.punchOut) {
      throw new Error("Already punched out");
    }

    attendance.punchOut = new Date();
    attendance.outLat = toDecOrNull(lat);
    attendance.outLng = toDecOrNull(lng);
    attendance.punchOutPhoto = photoPath || null;

    await attendance.save({ transaction: t });

    await t.commit();
    return attendance;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Get today's attendance (Field)
 */
exports.getTodayAttendance = async (userId) => {
  return Attendance.findOne({
    where: {
      userId,
      date: getToday(),
    },
  });
};

/**
 * Attendance report (Admin / Manager)
 */
exports.getAttendanceReport = async ({ fromDate, toDate, userId, page, limit }) => {
  const where = {
    date: { [Op.between]: [fromDate, toDate] },
  };

  if (userId) where.userId = userId;

  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const offset = (p - 1) * l;

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    order: [["date", "ASC"]],
    limit: l,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / l));

  return {
    data: rows,
    pagination: { page: p, limit: l, total: count, totalPages },
  };
};
