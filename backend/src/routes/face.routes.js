const router = require("express").Router();
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const uploadFaceMemory = require("../middlewares/uploadFaceMemory.middleware");
const controller = require("../controllers/face.controller");

router.post(
  "/analyze",
  authenticate,
  authorize("FIELD", "ADMIN", "MANAGER"),
  uploadFaceMemory.single("photo"),
  controller.analyze
);

// Professional enrollment flow: each sample is verified and embedded while the
// user is still in the guided flow. Final enrollment then only saves JSON to DB.
router.post(
  "/enroll-sample",
  authenticate,
  authorize("FIELD", "ADMIN", "MANAGER"),
  uploadFaceMemory.single("photo"),
  controller.enrollSample
);

router.post(
  "/enroll-complete",
  authenticate,
  authorize("FIELD", "ADMIN", "MANAGER"),
  controller.enrollComplete
);

// Keep old endpoint as fallback/backward compatibility.
router.post(
  "/enroll-multi",
  authenticate,
  authorize("FIELD", "ADMIN", "MANAGER"),
  uploadFaceMemory.array("photos", 3),
  controller.enrollMulti
);

module.exports = router;
