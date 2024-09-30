const express = require("express");
const router = express.Router();
const customers = require("../controllers/customerController");
const validator = require("../middlewares/validator/validator");
const {
  customerRequests,
} = require("../middlewares/requests/customerRequests");
const authenticateUser = require("../middlewares/authenticateUser");
const captchaVerify = require("../middlewares/googleCaptchaVerify");

//all customer routes
router.post(
  "/sign-up",
  validator(customerRequests.signup),
  captchaVerify,
  customers.insertCustomer
);
router.get(
  "/get-customer-details",
  authenticateUser,
  customers.getCustomerDetails
);

module.exports = router;
