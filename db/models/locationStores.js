const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const locationStoresSchema = new Schema(
  {
    store_name: { type: String, required: true },
    address: { type: String, maxLength: 100, required: true },
    area: { type: String, maxLength: 70, required: true },
    city: { type: String, maxLength: 50, required: true },
    state: { type: String, maxLength: 50, required: false },
    pincode: { type: String, minLength: 6, maxLength: 6, required: true },
    lattitude: { type: String, default: null },
    longitude: { type: String, default: null },
  },
  { timestamps: true }
);

const LocationStores = mongoose.model("location_stores", locationStoresSchema);

module.exports = LocationStores;
