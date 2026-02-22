const router = require('express').Router();
const controller = require('../controllers/visit.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Field user
router.post('/:id/check-in', authenticate, authorize('FIELD'), controller.checkIn);
router.post('/:id/check-out', authenticate, authorize('FIELD'), controller.checkOut);
router.get('/my', authenticate, authorize('FIELD'), controller.getMyVisits);

// Admin / Manager
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'FIELD'), controller.planVisit);
router.get('/report', authenticate, authorize('ADMIN', 'MANAGER'), controller.getReport);

module.exports = router;
