const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const couponCodeSchema = new Schema({
  coupon_code: { type: String, required: true },
  discount_value: { type: Number, required: true },
  discount_type: { type: String, required: false },
  description: { type: String, required: true },
  is_active: { type: Boolean, required: false },
});

const CouponCodes = mongoose.model("coupon_code", couponCodeSchema);

module.exports = CouponCodes;
