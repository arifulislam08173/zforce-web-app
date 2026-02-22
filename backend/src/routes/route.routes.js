const router = require("express").Router();
const controller = require("../controllers/route.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Everyone can view
router.get("/", authenticate, controller.getAll);
router.get("/:id", authenticate, controller.getOne);

// Only MANAGER/ADMIN can handle
router.post("/", authenticate, authorize("MANAGER", "ADMIN"), controller.create);
router.put("/:id", authenticate, authorize("MANAGER", "ADMIN"), controller.update);
router.delete("/:id", authenticate, authorize("MANAGER", "ADMIN"), controller.remove);


module.exports = router;
