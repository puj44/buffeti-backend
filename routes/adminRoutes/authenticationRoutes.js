const express = require("express");
const router = express.Router();
const {
  adminRequests,
} = require("../../admin/middlewares/requests/adminRequests");
const validator = require("../../admin/middlewares/validator/validator");
const {
  signin,
  checkstatus,
} = require("../../admin/controllers/authenticationController");

router.post("/sign-in", validator(adminRequests.signin), signin);
router.get("/get-status", checkstatus);

module.exports = router;
