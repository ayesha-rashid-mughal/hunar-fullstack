// routes/orders.js
const express = require('express');
const router = express.Router();
const { checkout, getMyOrders } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.post('/', checkout);
router.get('/', getMyOrders);

module.exports = router;
