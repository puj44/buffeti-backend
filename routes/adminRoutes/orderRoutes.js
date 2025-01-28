const express = require("express");
const {
  orderTransactionInfo,
  getOrders,
  getOrderInfo,
  updateOrderStatus,
} = require("../../admin/controllers/ordersController");
const {
  validateQueryParams,
} = require("../../admin/middlewares/validator/validateQueryParams");
const router = express.Router();

router.post("/order-transaction-info", orderTransactionInfo);
router.get("/get-orders", validateQueryParams("order"), getOrders);
router.get("/get-order-info/:id", getOrderInfo);
router.put("/update-order-status", updateOrderStatus);

module.exports = router;
