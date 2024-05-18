const express = require('express');
const router =  express.Router();
const auth = require('../controllers/authenticationController');

//all Authentication routes
router.post("/sign-in",auth.signin);
router.post("/verify-otp",auth.verifyOtp);

module.exports = router;


