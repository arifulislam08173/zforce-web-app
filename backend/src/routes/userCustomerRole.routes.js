const router = require("express").Router();
const controller = require("../controllers/userCustomerRole.controller");
const { authorize } = require("../middlewares/auth.middleware");

router.get("/", authorize("ADMIN", "MANAGER"), controller.list);
router.post("/assign", authorize("ADMIN", "MANAGER"), controller.assign);

module.exports = router;
