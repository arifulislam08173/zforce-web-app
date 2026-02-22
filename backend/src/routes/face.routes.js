const router = require("express").Router();
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const uploadFace = require("../middlewares/uploadFace.middleware");
const controller = require("../controllers/face.controller");

router.post("/enroll", authenticate, authorize("FIELD"), uploadFace.single("photo"), controller.enroll);

module.exports = router;
