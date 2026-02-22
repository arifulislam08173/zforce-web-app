const router = require("express").Router();
const controller = require("../controllers/report.controller");
const { authorize } = require("../middlewares/auth.middleware");

// ADMIN/MANAGER only
router.get("/orders", authorize("ADMIN", "MANAGER"), controller.orders);
router.get("/summary", authorize("ADMIN", "MANAGER"), controller.summary);
router.get("/performance", authorize("ADMIN", "MANAGER"), controller.performance);
router.get("/totals", authorize("ADMIN", "MANAGER"), controller.totals);

// PDF exports
router.get("/orders.pdf", authorize("ADMIN", "MANAGER"), controller.ordersPdf);
router.get("/performance.pdf", authorize("ADMIN", "MANAGER"), controller.performancePdf);


module.exports = router;
