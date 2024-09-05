const express = require("express");
const router = express.Router();
const {
  createPayment,
  verifyPayment,
} = require("../controllers/PaymentController");
const validateLocation = require("../middlewares/validateLocation");
const authenticateUser = require("../middlewares/authenticateUser");

router.post("/create-payment/:id",authenticateUser, createPayment);
router.post("/verify-payment", verifyPayment);

module.exports = router;
