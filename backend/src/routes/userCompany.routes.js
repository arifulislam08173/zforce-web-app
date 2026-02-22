const router = require("express").Router();
const controller = require("../controllers/userCompany.controller");
const { authorize } = require("../middlewares/auth.middleware");

router.get("/", authorize("ADMIN", "MANAGER"), controller.list);
router.post("/assign", authorize("ADMIN", "MANAGER"), controller.assign);
router.get("/eligible-users", authorize("ADMIN", "MANAGER"), controller.eligibleUsers);

module.exports = router;
