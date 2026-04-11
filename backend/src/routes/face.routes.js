const router = require("express").Router();
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const uploadFaceMemory = require("../middlewares/uploadFaceMemory.middleware");
const controller = require("../controllers/face.controller");

router.post(
  "/enroll-multi",
  authenticate,
  authorize("FIELD", "ADMIN", "MANAGER"),
  uploadFaceMemory.array("photos", 10),
  controller.enrollMulti
);

module.exports = router;