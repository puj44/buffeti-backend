const express = require("express");
const router = express.Router();
const { createPayment } = require("../controllers/paymentController");
const validateLocation = require("../middlewares/validateLocation");

router.post("/create-payment/:id", createPayment);

module.exports = router;
