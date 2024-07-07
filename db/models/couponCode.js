const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponCodeSchema = new Schema({
  coupon_code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  discount_type: {
    type: String,
    enum: ["percentage", "amount"],
    required: true,
  },
  discount_value: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  expiration_date: {
    type: Date,
    required: true,
  },
  usage_limit: {
    type: Number,
    required: true,
    default: 1,
  },
  usage_count: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "expired", "used"],
    default: "active",
  },
});

// Middleware to update the 'updated_at' field
couponCodeSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const CouponCode = mongoose.model("coupon_code", couponCodeSchema);

module.exports = { CouponCode };
