const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require("../middlewares/auth.middleware");
// const controller = require('../controllers/order.controller');
const orderController = require("../controllers/order.controller");

// router.post('/', controller.createOrder);

// all orders endpoints protected
router.use(authenticate);

// List (ADMIN/MANAGER can see all, FIELD sees own)
router.get("/", orderController.getOrders);

router.get("/open-for-collection", orderController.getOpenForCollection);
router.get("/:id/invoice.pdf", orderController.downloadInvoicePdf);
// Single
router.get("/:id", orderController.getOrderById);

// Create
router.post("/", authorize("ADMIN", "MANAGER", "FIELD"), orderController.createOrder);

// Update
router.put("/:id", authorize("ADMIN", "MANAGER","FIELD"), orderController.updateOrder);

// Delete
router.delete("/:id", authorize("ADMIN", "MANAGER"), orderController.deleteOrder);

module.exports = router;
