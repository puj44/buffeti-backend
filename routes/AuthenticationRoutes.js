const express = require("express");
const router = express.Router();
const auth = require("../controllers/authenticationController");
const { authRequests } = require("../middlewares/requests/authRequests");
const validator = require("../middlewares/validator/validator");
const captchaVerify = require("../middlewares/googleCaptchaVerify");

//all Authentication routes
router.post(
  "/sign-in",
  validator(authRequests.signin),
  captchaVerify,
  auth.signin
);
router.post("/verify", validator(authRequests.verify), auth.verifyOtp);
router.get("/get-status", auth.checkstatus);
router.post("/sign-out", auth.signout);

module.exports = router;
