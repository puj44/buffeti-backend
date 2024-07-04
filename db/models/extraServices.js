const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const extraServicesSchema = new Schema({
  slug: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: false },
});

const ExtraServices = mongoose.model("extra_services", extraServicesSchema);

module.exports = { ExtraServices };
