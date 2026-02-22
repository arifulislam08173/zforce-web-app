// const express = require("express");
// const router = express.Router();
// const { authenticate } = require("../middlewares/auth.middleware");
// const { Product } = require("../models");

// router.use(authenticate);

// router.get("/dropdown", async (req, res, next) => {
//   try {
//     const products = await Product.findAll({
//       attributes: ["id", "name", "sku", "price", "stock"],
//       order: [["name", "ASC"]],
//       limit: 500,
//     });
//     res.json(products);
//   } catch (err) {
//     next(err);
//   }
// });

// module.exports = router;



const router = require("express").Router();
const controller = require("../controllers/product.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// All product routes require login
router.use(authenticate);

// Everyone (FIELD/ADMIN/MANAGER)
router.get("/dropdown", controller.getDropdown);

// Admin/Manager - list + details
router.get("/", authorize("ADMIN", "MANAGER"), controller.listProducts);
router.get("/:id", authorize("ADMIN", "MANAGER"), controller.getById);

// Admin only - CRUD
router.post("/", authorize("ADMIN"), controller.createProduct);
router.put("/:id", authorize("ADMIN"), controller.updateProduct);
router.delete("/:id", authorize("ADMIN"), controller.deleteProduct);

module.exports = router;
