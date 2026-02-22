const { Op } = require("sequelize");
const { Product } = require("../models");

const toInt = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
};

const norm = (v) => String(v || "").trim();

exports.getDropdown = async () => {
  return Product.findAll({
    where: { status: "ACTIVE" },
    attributes: ["id", "name", "sku", "price", "stock"],
    order: [["name", "ASC"]],
    limit: 500,
  });
};

exports.listProducts = async ({ page, limit, q, status } = {}) => {
  const where = {};

  const qStr = norm(q);
  if (qStr) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${qStr}%` } },
      { sku: { [Op.iLike]: `%${qStr}%` } },
      { description: { [Op.iLike]: `%${qStr}%` } },
    ];
  }

  const st = norm(status);
  if (st) where.status = st.toUpperCase();

  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const offset = (p - 1) * l;

  const { rows, count } = await Product.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: l,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(count / l));
  return {
    data: rows,
    pagination: { page: p, limit: l, total: count, totalPages },
  };
};

exports.getById = async (id) => {
  return Product.findByPk(id);
};

exports.createProduct = async (data) => {
  const name = norm(data.name);
  if (!name) throw new Error("Name is required");

  const price = Number(data.price);
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid number (>= 0)");

  const stock = data.stock === "" || data.stock == null ? 0 : Number(data.stock);
  if (!Number.isFinite(stock) || stock < 0) throw new Error("Stock must be a valid number (>= 0)");

  const sku = norm(data.sku) || null;
  if (sku) {
    const exists = await Product.findOne({ where: { sku } });
    if (exists) throw new Error("SKU already exists");
  }

  return Product.create({
    name,
    sku,
    description: norm(data.description) || null,
    price,
    stock: Math.floor(stock),
    status: norm(data.status || "ACTIVE").toUpperCase(),
  });
};

exports.updateProduct = async (id, data) => {
  const row = await Product.findByPk(id);
  if (!row) throw new Error("Product not found");

  if (data.name != null) {
    const name = norm(data.name);
    if (!name) throw new Error("Name is required");
    row.name = name;
  }

  if (data.sku !== undefined) {
    const sku = norm(data.sku) || null;
    if (sku && sku !== row.sku) {
      const exists = await Product.findOne({ where: { sku } });
      if (exists) throw new Error("SKU already exists");
    }
    row.sku = sku;
  }

  if (data.description !== undefined) row.description = norm(data.description) || null;

  if (data.price !== undefined) {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a valid number (>= 0)");
    row.price = price;
  }

  if (data.stock !== undefined) {
    const stock = Number(data.stock);
    if (!Number.isFinite(stock) || stock < 0) throw new Error("Stock must be a valid number (>= 0)");
    row.stock = Math.floor(stock);
  }

  if (data.status) row.status = norm(data.status).toUpperCase();

  await row.save();
  return row;
};

exports.deleteProduct = async (id) => {
  const row = await Product.findByPk(id);
  if (!row) throw new Error("Product not found");
  await row.destroy();
  return true;
};
