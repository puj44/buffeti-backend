const express = require("express");
const {
  getCustomer,
  getCustomerDetails,
} = require("../../admin/controllers/customerController");
const router = express.Router();

router.get("/get-customer", getCustomer);
router.get("/get-customer-details/:id", getCustomerDetails);

module.exports = router;
