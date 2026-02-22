const router = require('express').Router();
const controller = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const uploadFaceMemory = require("../middlewares/uploadFaceMemory.middleware");

// Field user
// router.post('/punch-in', authenticate, authorize('FIELD'), controller.punchIn);
// router.post('/punch-out', authenticate, authorize('FIELD'), controller.punchOut);

router.post("/punch-in", authenticate, authorize("FIELD"), uploadFaceMemory.single("photo"), controller.punchIn);
router.post("/punch-out", authenticate, authorize("FIELD"), uploadFaceMemory.single("photo"), controller.punchOut);

router.get('/today', authenticate, controller.getTodayAttendance);

// Admin / Manager
router.get(
  '/report',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  controller.getAttendanceReport
);

module.exports = router;
