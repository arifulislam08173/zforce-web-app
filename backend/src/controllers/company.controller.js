const service = require("../services/company.service");

exports.dropdown = async (req, res, next) => {
  try {
    res.json(await service.dropdown());
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    res.json({ data: await service.list() });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const c = await service.getById(req.params.id);
    if (!c) return res.status(404).json({ message: "Company not found" });
    res.json({ data: c });
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    res.status(201).json({ data: await service.create(req.body) });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const c = await service.update(req.params.id, req.body);
    if (!c) return res.status(404).json({ message: "Company not found" });
    res.json({ data: c });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await service.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Company not found" });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
