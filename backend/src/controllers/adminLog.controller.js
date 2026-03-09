const AdminLogService = require('../services/adminLog.service');

exports.getAdminLogs = async (req, res, next) => {
  try {
    const result = await AdminLogService.listLogs(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
