const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const controller = require('../controllers/adminLog.controller');

router.use(authenticate, authorize('ADMIN', 'MANAGER'));
router.get('/', controller.getAdminLogs);

module.exports = router;
