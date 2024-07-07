const express = require("express");
const router = express.Router();
const {
  addtocart,
  getCart,
  getCartInformation,
  updateCart,
  updateCartItems,
  getExtraServices,
  deleteCart,
  deleteCartItems,
  addCoupon,
  removeCoupon,
} = require("../controllers/cartController");
const validateLocation = require("../middlewares/validateLocation");

router.post("/add-to-cart", validateLocation, addtocart);
router.get("/get-cart", getCart);
router.get("/get-information", getCartInformation);
router.put("/cart-update/:id", updateCart);
router.put("/cart-items-update/:id", updateCartItems);
router.delete("/cart-delete/:id", deleteCart);
router.delete("/cart-items-delete/:id", deleteCartItems);
router.get("/get-extra-services", getExtraServices);
router.put("/coupon/add/:id", addCoupon);
router.delete("/coupon/remove/:id", removeCoupon);

module.exports = router;
