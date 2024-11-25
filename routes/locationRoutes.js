const express = require("express");
const router = express.Router();
const {
  getLocation,
  getDevileryCharges,
} = require("../controllers/locationController");
const validateBaseURL = require("../middlewares/validateBaseURL");

router.post("/get-location", validateBaseURL, getLocation);

module.exports = router;
