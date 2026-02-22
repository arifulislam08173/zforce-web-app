const productService = require("../services/product.service");

exports.getDropdown = async (req, res, next) => {
  try {
    const data = await productService.getDropdown();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const result = await productService.listProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const row = await productService.getById(req.params.id);
    if (!row) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ data: row });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const row = await productService.createProduct(req.body);
    res.status(201).json({ message: "Product created", data: row });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const row = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ message: "Product updated", data: row });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};
