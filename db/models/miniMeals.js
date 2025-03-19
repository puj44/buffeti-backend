const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const miniMealsSchema = new Schema(
  {
    location: { type: String, required: true, index: true },
    slug: { type: String, required: true, index: true },
    item_name: { type: String, required: true },
    category: { type: Object, required: true },
    price: { type: Number, required: true, default: null },
    food_cost: { type: Number, required: true, default: null },
    description: { type: String, required: true },
    is_jain: { type: Boolean, default: false },
    img_url: { type: String, required: false },
  },
  { timestamps: true }
);

const MiniMeals = mongoose.model("mini_meals", miniMealsSchema);

module.exports = MiniMeals;
