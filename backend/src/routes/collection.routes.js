const router = require('express').Router();
const controller = require('../controllers/collection.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Field user
router.post(
  '/',
  authenticate,
  authorize('FIELD'),
  controller.createCollection
);

router.get(
  '/my',
  authenticate,
  authorize('FIELD'),
  controller.getMyCollections
);

router.get("/:id/receipt.pdf", controller.downloadReceiptPdf);

// Admin / Manager
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  controller.updateStatus
);

router.get(
  '/report',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  controller.getReport
);

module.exports = router;
