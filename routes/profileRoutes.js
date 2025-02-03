const express = require("express");
const router = express.Router();
const {
  addAddress,
  editAddress,
  deleteAddress,
  getAddress,
  updateProfile,
  verifyEmail,
  sendOtpEmail,
} = require("../controllers/profileController");
const { addressRequests } = require("../middlewares/requests/addressRequests");
const { profileRequests } = require("../middlewares/requests/profileRequests");
const validator = require("../middlewares/validator/validator");

router.get("/address/list", getAddress);
router.post("/address/add", validator(addressRequests.add), addAddress);
router.put("/address/edit/:id", validator(addressRequests.edit), editAddress);
router.delete("/address/delete/:id", deleteAddress);
router.put("/update-profile", updateProfile);
router.post(
  "/send-otp-email",
  validator(profileRequests.sendOtpEmail),
  sendOtpEmail
);
router.post(
  "/verify-email",
  validator(profileRequests.verifyEmail),
  verifyEmail
);

module.exports = router;
