const express = require('express');
const router = express.Router();
const customers = require("../controllers/customerController")

//all customer routes
router.get("/",customers.getCustomers);

module.exports = router;