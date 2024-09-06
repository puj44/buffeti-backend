const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const customersSchema = new Schema(
  {
    name: { type: String },
    mobile_number: { type: Number, unique: true, required: true },
    email: {
      type: String,
      default: null,
    },
    is_email_verified: { type: Boolean, default: false },
    refresh_token: [String],
  },
  { timestamps: true }
);

const Customers = mongoose.model("customers", customersSchema);
module.exports = { Customers };
