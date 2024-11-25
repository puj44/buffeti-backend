const mongoose = require("mongoose");
const { Schema, Model } = mongoose;
const moment = require("moment");

const itemPricingSchema = new Schema(
  {
    item_name: { type: String, required: true },
    amount: { type: Number, required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const addOnChargesSchema = new Schema(
  {
    addOnCharges: { type: Number, required: false },
    addOnChargesQty: { type: Number, required: false },
  },
  { _id: false }
);
const extraServicesChargesSchema = new Schema(
  {
    name: { type: String, required: false },
    price: { type: Number, required: false },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    order_number: {
      type: String,
      required: true,
      unique: true,
    },
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
    delivery_address: {
      type: String,
      required: true,
      default: null,
    },
    delivery_date: {
      type: Date,
      required: false,
      default: null,
      validate: {
        validator: function (date) {
          // Check if the date is a valid date
          return moment(date).isValid();
        },
        message: "Invalid delivery date.",
      },
    },
    delivery_time: {
      type: String,
      required: true,
      validate: {
        validator: function (time) {
          // Validate time format (HH:mm)
          return moment(time, "hh:mm a", true).isValid();
        },
        message: "Invalid delivery time format. Use hh:mm a.",
      },
    },
    cooking_instruction: { type: String, required: false, default: null },
    coupon_code: { type: String, required: false, default: null },
    coupon_discount_value: { type: Number, required: false, default: null },
    delivery_charges: { type: Number, required: false, default: 0 },
    extra_services_charges: [extraServicesChargesSchema],
    order_status: {
      type: String,
      required: false,
      enum: [
        "placed",
        "cancelled",
        "confirmed",
        "out_for_delivery",
        "preparing",
      ],
      default: "placed",
    },
    payment_status: {
      type: String,
      required: false,
      enum: ["partially_paid", "fully_paid", "pending"],
      default: "pending",
    },
    payment_mode: {
      type: String,
      required: false,
      enum: ["advance", "full_payment"],
    },
    payment_type: {
      type: String,
      required: false,
      enum: ["cod", "online"],
    },
    total_amount: { type: Number, required: true },
    total_billed_amount: { type: Number, required: true },
    amount_due: { type: Number, required: true },
    item_pricing: [itemPricingSchema],
    addon_charges: [addOnChargesSchema],
    extra_charges: [itemPricingSchema],
  },
  { timestamps: true }
);

const orderitemSchema = new Schema(
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

const orderItemsSchema = new Schema({
  order_id: { type: Schema.Types.ObjectId, ref: "order", required: true },
  no_of_people: { type: Number, required: true },
  package_name: { type: String, required: false, default: null },
  items: { type: Map, of: orderitemSchema },
});

const Order = mongoose.model("order", orderSchema);
const OrderItems = mongoose.model("order_items", orderItemsSchema);

module.exports = { Order, OrderItems };
