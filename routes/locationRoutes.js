const express = require("express");
const router = express.Router();
const {
  getLocation,
  getDevileryCharges,
} = require("../controllers/locationController");

router.post("/get-location", getLocation);

module.exports = router;
