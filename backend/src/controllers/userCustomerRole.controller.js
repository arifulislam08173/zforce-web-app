const service = require("../services/userCustomerRole.service");

exports.list = async (req, res, next) => {
  try {
    res.json({ data: await service.list(req.query) });
  } catch (e) {
    next(e);
  }
};

exports.assign = async (req, res, next) => {
  try {
    res.status(201).json({ data: await service.assign(req.body) });
  } catch (e) {
    next(e);
  }
};
