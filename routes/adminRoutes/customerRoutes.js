const express = require("express");
const {
  getCustomers,
  getCustomerDetails,
} = require("../../admin/controllers/customerController");
const {
  validateQueryParams,
} = require("../../admin/middlewares/validator/validateQueryParams");
const router = express.Router();

router.get("/get-customer", validateQueryParams("customer"), getCustomers);
router.get("/get-customer-details/:id", getCustomerDetails);

module.exports = router;
