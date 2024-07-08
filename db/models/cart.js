const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const cartSchema = new Schema({
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: "customers",
    required: true,
  },
  menu_option: { type: String, required: true },
  location: { type: String, required: true },
  delivery_address_id: {
    type: Schema.Types.ObjectId,
    ref: "customer_addresses",
    required: false,
  }, //ref to customer address
  delivery_date: { type: Date, required: false, default:null },
  delivery_time: { type: String, required: false, default:null },
  cooking_instruction: { type: String, required: false, default:null },
  coupon_code: { type: String },
  delivery_charges: { type: Number, required: false, default: 0 },
  extra_services: { type: [String], default: null },
});

const itemSchema = new Schema(
  {
    additional_qty: { type: Number, required: false, default: null },
    added_extra_items: {
      type: Map,
      of: Number,
      required: false,
      default: null,
    },
    selected_preparation: {
      type: String,
      required: false,
      default: null,
    },
  },
  { _id: false }
);

const cartItemsSchema = new Schema({
  cart_id: { type: Schema.Types.ObjectId, ref: "cart", required: true },
  no_of_people: { type: Number, required: true },
  package_name: { type: String, required: false, default: null },
  items: { type: Map, of: itemSchema },
});

const Cart = mongoose.model("cart", cartSchema);
const CartItems = mongoose.model("cart_items", cartItemsSchema);

module.exports = { Cart, CartItems };
