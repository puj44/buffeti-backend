const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getOrder,
  getOrderInfo,
} = require("../controllers/orderController");
const validateLocation = require("../middlewares/validateLocation");

router.post("/place-order", placeOrder);
router.get("/get-order", getOrder);
router.get("/get-order-info/:id", getOrderInfo);

module.exports = router;
