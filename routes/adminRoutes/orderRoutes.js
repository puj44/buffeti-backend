const express = require("express");
const { orderTransactionInfo } = require("../../admin/controllers/ordersController");
const router = express.Router();

router.post("/order-transaction-info", orderTransactionInfo);

module.exports = router;
