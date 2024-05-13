const express = require('express');
const router =  express.Router();
const auth = require('../controllers/authenticationController');

//all Authentication routes
router.post("/sendOtp",auth.sendOtp);
router.post("/verifyOtp",auth.verifyOtp);

module.exports = router;


