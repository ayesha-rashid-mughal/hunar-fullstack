// routes/admin.js
const express = require('express');
const router = express.Router();
const { getStats, getAllOrders, updateOrderStatus } = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/stats', getStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
