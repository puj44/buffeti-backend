const express = require("express");
const {
  orderTransactionInfo,
  getOrder,
  getOrderInfo,
} = require("../../admin/controllers/ordersController");
const router = express.Router();

router.post("/order-transaction-info", orderTransactionInfo);
router.get("/get-order", getOrder);
router.get("/get-order-info/:id", getOrderInfo);

module.exports = router;
