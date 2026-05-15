const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/stats", dashboardController.getStats);
router.get("/analytics", dashboardController.getAnalytics);

module.exports = router;
