const express = require('express');
const router = express.Router();
const customers = require("../controllers/customerController");
const validator = require("../middlewares/validator/validator");
const {customerRequests} = require("../middlewares/requests/customerRequests");

//all customer routes
router.post("/sign-up",validator(customerRequests.signup),customers.insertCustomer);
//router.get("/",customers.getCustomers);

module.exports = router;