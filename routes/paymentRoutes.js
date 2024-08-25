const express = require("express");
const router = express.Router();
const {
  createPayment,
  verifyPayment,
} = require("../controllers/PaymentController");
const validateLocation = require("../middlewares/validateLocation");

router.post("/create-payment/:id", createPayment);
router.post("/verify-payment/:id", verifyPayment);

module.exports = router;
