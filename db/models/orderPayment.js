const mongoose = require("mongoose");
const { Schema, Model } = mongoose;

const orderPaymentSchema = new Schema({
  order_number: { type: String, ref: "order", required: true },
  order_id: { type: Schema.Types.ObjectId, ref: "orderItems", required: true },
  payment_amount: { type: String, required: true },
  payment_status: {
    type: String,
    required: false,
    enum: ["init", "completed", "failed","cancelled"],
  },
  razorypay_payment_id:{type:String,required:false,default:null},
  payment_method: { type: String, required: false },
  razorpay_order_id: { type: String, required: false, unqiue: true },
  razorpay_payment_id: {
    type: String,
    required: false,
    unqiue: true,
    default: null,
  },
  razorpay_signature: {
    type: String,
    required: false,
    unqiue: true,
    default: null,
  },
},{timestamps:true});

const OrderPayment = mongoose.model("order_payment", orderPaymentSchema);
module.exports = { OrderPayment };
