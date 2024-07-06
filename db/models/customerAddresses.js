const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const customersAddressesSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "customers",
      required: true,
    },
    full_name: { type: String, required: true },
    house_building_no: { type: String, required: true },
    address: { type: String, maxLength: 100, required: true },
    area: { type: String, maxLength: 70, required: true },
    city: { type: String, maxLength: 50, required: true },
    pincode: { type: String, minLength: 6, maxLength: 6, required: true },
    lattitude: { type: String, default: null },
    longitude: { type: String, default: null },
  },
  { timestamps: true }
);

const CustomersAddresses = mongoose.model(
  "customer_addresses",
  customersAddressesSchema
);

module.exports = { CustomersAddresses };
