const express = require('express');
const router =  express.Router();
const auth = require('../controllers/authenticationController');
const { authRequests } = require('../middlewares/requests/authRequests');
const validator = require("../middlewares/validator/validator");

//all Authentication routes
router.post("/sign-in", validator(authRequests.signin),auth.signin);
router.post("/verify",validator(authRequests.verify), auth.verifyOtp);
router.get("/get-status",auth.checkstatus);
router.get("/sign-out",auth.signout);

module.exports = router;


