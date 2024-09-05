const { Order } = require("../db/models/order");
const { OrderPayment } = require("../db/models/orderPayment");
const { Customers } = require("../db/models/customers");
const { razorpay } = require("../config/razorpayClient");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const axios = require("axios");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const webhookApiLogs = require("../db/models/webhookApiLogs");

const createPayment = async (req, res) => {
  const { id } = req.user ?? {};
  const orderNumber = req.params.id;
  const { payment_mode } = req.body;
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    const orderDetails = await Order.findOne({
      order_number: orderNumber,
    }).lean();
    const {
      order_number,
      total_billed_amount,
      amount_due,
      payment_status,
      _id,
    } = orderDetails;

    if (!orderDetails) {
      return sendRes(res, 404, {
        message: "Order not found",
      });
    }

    // check if full payment is done already.
    if (payment_status === "fully_paid") {
      return sendRes(res, 402, {
        message: "Payment is already paid.",
      });
    }

    let amount_to_be_paid = total_billed_amount;

    if (payment_status === "pending") {
      if (payment_mode === "advance") {
        amount_to_be_paid = Math.ceil(total_billed_amount * 0.2); // 20% discount for advance payment.
      }
    } else {
      amount_to_be_paid = amount_due;
    }

    const options = {
      amount: amount_to_be_paid * 100,
      currency: "INR",
      receipt: order_number,
      payment_capture: 1,
    };

    const payment_call = await razorpay.orders.create(options);


    if (!payment_call) {
      return sendRes(res, 402, {
        message: "Failed to create payment",
      });
    }
    const orderPayment = await OrderPayment.create(
      [
        {
          order_number: order_number,
          order_id: _id,
          payment_amount: amount_to_be_paid,
          payment_status: "init",
          razorpay_order_id: payment_call?.id,
        },
      ],
      { session }
    );

    if (!orderPayment) {
      return sendRes(res, 402, {
        message: "Failed to create order payment",
      });
    }

    // const payment_api_logs = await PaymentApiLogs.create({

    // })

    const customer_data = await Customers.findOne({ _id: id }).lean();
    if (!customer_data) {
      return sendRes(res, 402, {
        message: "Failed to fetch customer data",
      });
    }
    const { name, mobile_number, email } = customer_data;

    await session.commitTransaction();

    sendRes(res, 200, {
      data: {
        amount: amount_to_be_paid,
        order_id: payment_call.id,
        prefill: {
          name: name,
          contact: mobile_number,
          email: email,
        },
      },
      message: "payment status updated successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("Create Payment Error:", err);
    sendError(res, err);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const secret_key = process.env.TEST_KEY_SECRET;
    const data = crypto.createHmac("sha256", secret_key);
    data.update(JSON.stringify(req.body));
    const digest = data.digest("hex");
    await webhookApiLogs.create({
      order_number:req?.body?.payload?.payment?.entity?.order_id ?? null,
      request_body:JSON.stringify(req?.body ?? {})
    })
    if (digest === req.headers["x-razorpay-signature"]) {
      const { event, payload } = req.body;
      
      if(!event || !payload || !payload?.payment?.entity){
        return sendRes(res, 402, {
          message: "Invalid Payload",
        });
      }
      const { amount, order_id, id } = payload.payment.entity;
      const orderPaymentDetails = await OrderPayment.findOne({
        razorpay_order_id: order_id,
      });
      const orderId = orderPaymentDetails.order_id;
      const orderDetails = await Order.findOne({
        _id: orderId,
      }).lean();

      switch (event.event) {
        case "payment.captured":
        case "payment.authorized":
          const amountDueInPaise = Number(orderDetails.amount_due * 100)
          console.log("Order Payment ID:",order_id,amountDueInPaise,"----Amount Paid:",amount,"----Order Details:",orderDetails)
          if (amount === amountDueInPaise) {
            await Order.updateOne(
              { _id: orderId },
              { $set: { payment_status: "fully_paid"} }
            );
          }else{
            await Order.updateOne(
              { _id: orderId },
              { $set: { payment_status: "partially_paid" } }
            );
          }
          await OrderPayment.updateOne(
            { razorpay_order_id: order_id },
            { $set: { payment_status: "completed", payment_method:payload.payment.entity?.method ?? null, razorpay_payment_id: id } }
          );
          break;
        case "payment.failed":
          await OrderPayment.updateOne(
            { razorpay_order_id: order_id },
            { $set: { payment_status: "failed" } }
          );
          break;
        default:
          // console.log(`Unhandled event: ${event}`);
          break;
      }
      return sendRes(res, 200, {
        message: "Payment captured successfully",
      });
    } else {
      return sendRes(res, 401, {
        message: "Invalid Signature",
      });
    }
  } catch (err) {
    console.log("Verify Payment Error:", err);
    sendError(res, err);
  }
};
module.exports = { createPayment, verifyPayment };
