const visitService = require("../services/visit.service");

const pickLatLng = (body) => {
  const lat = body?.lat ?? body?.latitude ?? null;
  const lng = body?.lng ?? body?.longitude ?? null;
  return { lat, lng };
};

/**
 * Plan a visit (Admin / Manager)
 */
exports.planVisit = async (req, res, next) => {
  try {
    // const visit = await visitService.planVisit(req.body);
    const visit = await visitService.planVisit(req.user, req.body);
    res.status(201).json({ message: "Visit planned", data: visit });
  } catch (err) {
    next(err);
  }
};

/**
 * Check-in (Field user)
 */
exports.checkIn = async (req, res, next) => {
  try {
    const { lat, lng } = pickLatLng(req.body);
    const visit = await visitService.checkIn(req.user.id, req.params.id, { lat, lng });
    res.status(200).json({ message: "Checked in", data: visit });
  } catch (err) {
    next(err);
  }
};

/**
 * Check-out (Field user)
 */
exports.checkOut = async (req, res, next) => {
  try {
    const { lat, lng } = pickLatLng(req.body);
    const { notes } = req.body;
    const visit = await visitService.checkOut(req.user.id, req.params.id, { lat, lng, notes });
    res.status(200).json({ message: "Checked out", data: visit });
  } catch (err) {
    next(err);
  }
};

/**
 * Get my visits (Field user)
 */
exports.getMyVisits = async (req, res, next) => {
  try {
    const result = await visitService.getMyVisits(req.user.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Visit report (Admin / Manager)
 */
exports.getReport = async (req, res, next) => {
  try {
    const result = await visitService.getVisitReport(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
