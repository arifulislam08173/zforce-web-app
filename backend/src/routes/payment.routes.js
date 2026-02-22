const router = require("express").Router();
const controller = require("../controllers/payment.controller");
const { authorize } = require("../middlewares/auth.middleware");

// we can enforce in controller by role + ownership.
router.get("/orders/:id/summary", authorize("ADMIN", "MANAGER", "FIELD"), controller.orderSummary);

module.exports = router;
