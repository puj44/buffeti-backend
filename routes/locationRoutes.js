const express = require("express");
const router = express.Router();
const {
  getLocation,
  getDevileryCharges,
} = require("../controllers/locationController");
const captchaVerify = require("../middlewares/googleCaptchaVerify");

router.post("/get-location", captchaVerify, getLocation);

module.exports = router;
