const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const couponCodeSchema = new Schema({
  coupon_code: { type: String, required: true },
  discount_value: { type: String, required: true },
  discount_type: { type: Number, required: false },
  description: { type: String, required: true },
  is_active: { type: Boolean, required: false },
});

const CouponCodeServices = mongoose.model("coupon_code", couponCodeSchema);

module.exports = {CouponCodeServices} ;
