const router = require("express").Router();
const { Op } = require("sequelize");
const { User, Customer } = require("../models");

// GET /api/search/users?q=A&limit=10
router.get("/users", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit || 10), 10);
    if (!q) return res.json([]);

    const users = await User.findAll({
      where: {
        [Op.or]: [{ id: q }, { name: { [Op.iLike]: `%${q}%` } }],
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit,
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/search/customers?q=A&limit=10
router.get("/customers", async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(Number(req.query.limit || 10), 10);
    if (!q) return res.json([]);

    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { id: q },
          { name: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } },
        ],
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      limit,
    });

    res.json(customers);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
