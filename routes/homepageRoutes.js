const express = require('express');
const router = express.Router();
const homepage= require("../controllers/customerController");
const validator = require("../middlewares/validator");
//const {customerRequests} = require("../middlewares/requests/customerRequests");

//all customer routes
//router.post("/sign-up",);
//router.get("/",customers.getCustomers);

module.exports = router;