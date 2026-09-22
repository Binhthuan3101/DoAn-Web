const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders } = require('../controllers/orderController');

router.post('/', createOrder);
router.get('/my', getMyOrders);

module.exports = router;