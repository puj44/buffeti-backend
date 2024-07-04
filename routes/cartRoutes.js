const express = require("express");
const router = express.Router();
const { addtocart, getCart } = require("../controllers/cartController");
const {
  updateCart,
  updateCartItems,
} = require("../controllers/cartUpdateController");
const validateLocation = require("../middlewares/validateLocation");

router.post("/add-to-cart", validateLocation, addtocart);
router.get("/get-cart", getCart);
router.put("/cart-update/:id", validateLocation, updateCart);
router.put("/cart-items-update/:cart_id", validateLocation, updateCartItems);

module.exports = router;
