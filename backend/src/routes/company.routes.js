const router = require("express").Router();
const controller = require("../controllers/company.controller");
const { authorize } = require("../middlewares/auth.middleware");

router.get("/dropdown", authorize("ADMIN", "MANAGER"), controller.dropdown);

router.get("/", authorize("ADMIN", "MANAGER"), controller.list);
router.get("/:id", authorize("ADMIN", "MANAGER"), controller.getById);

router.post("/", authorize("ADMIN"), controller.create);
router.put("/:id", authorize("ADMIN"), controller.update);
router.delete("/:id", authorize("ADMIN"), controller.remove);

module.exports = router;
