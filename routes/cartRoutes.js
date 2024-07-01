const express = require("express");
const router = express.Router();
const { addtocart, getCart } = require("../controllers/cartController");
const validateLocation = require("../middlewares/validateLocation");

router.post("/add-to-cart", validateLocation, addtocart);
router.get("/get-cart", getCart);

module.exports = router;
