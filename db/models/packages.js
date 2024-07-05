const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const packagesSchema = new Schema({
  location: { type: String, required: true, index: true },
  menu_option: { type: String, required: true, index: true },
  slug: { type: String, required: true, index: true },
  package_name: { type: String, required: true },
  categories_description: { type: String, required: true },
  categories_mapping: { type: Object, required: true },
  items_mapping: { type: [String], required: true },
  category: { type: Object, required: true },
  _10_20_pax: { type: Number, required: true },
  _20_30_pax: { type: Number, required: true },
  _30_plus_pax: { type: Number, required: true },
});

const Packages = mongoose.model("packages", packagesSchema);

module.exports = Packages;
