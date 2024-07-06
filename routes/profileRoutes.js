const express = require("express");
const router = express.Router();
const { addAddress, editAddress, deleteAddress, getAddress } = require("../controllers/profileController");
const { addressRequests } = require("../middlewares/requests/addressRequests");
const validator = require("../middlewares/validator/validator");

router.get("/address/list", getAddress);
router.post("/address/add", validator(addressRequests.add) ,addAddress);
router.put("/address/edit/:id", validator(addressRequests.edit) ,editAddress);
router.delete("/address/delete/:id", deleteAddress);

module.exports = router;
