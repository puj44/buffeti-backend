const moment = require("moment");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { default: mongoose } = require("mongoose");
const { get, set, remove } = require("../common/redisGetterSetter");
const { Order, OrderItems } = require("../db/models/order");
const { Cart, CartItems } = require("../db/models/cart");
const { delivery_fees } = require("../config/keys");
const { generateOrderNumber } = require("../common/commonHelper");

const placeOrder = async (req, res) => {
  const { id } = req.user ?? {};
  const { location } = req.headers;
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    if (!id) {
      return sendRes(res, 404, {
        message: "Customer id not found",
      });
    }
    let cartCacheData = await get(`cart-${id}`, true);


    if (!cartCacheData || !cartCacheData.cart_data) {
      return sendRes(res, 400, {
        message: "Cart data not found!",
      });
    }
    const {
      cart_id,
      location,
      menu_option,
      cart_data,
      billing_details,
      delivery_address_id,
      delivery_date,
      delivery_time,
      cooking_instruction,
      delivery_charges,
      extra_services,
    } = cartCacheData;
    const ordersCount = await Order.countDocuments({ customer_id: id });
    const order_number = generateOrderNumber(menu_option, ordersCount);
    const existingOrder = await Order.findOne({ customer_id: id,order_number:order_number });

    if (existingOrder) {
      return sendRes(res, 400, {
        message: "You have already placed an order!",
      });
    }

   

    
    const { items, no_of_people, package_name } = cart_data;
    const {
      item_pricing,
      addon_charges,
      extra_charges,
      total_items_amount,
      total_amount,
      total_billed_amount,
      coupon_type,
      coupon_discount,
      coupon_discount_value,
      extra_services_charges,
    } = billing_details;

    const dbCartData = await Cart.findOne({ customer_id: id }).lean();
    if (!dbCartData) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }

    

    const orderInsert = await Order.create(
      [
        {
          order_number: order_number,
          customer_id: id,
          menu_option: menu_option,
          location: location,
          delivery_address_id: delivery_address_id,
          extra_charges: extra_charges,
          delivery_date: delivery_date,
          delivery_time: delivery_time,
          cooking_instruction: cooking_instruction,
          coupon_code: dbCartData?.coupon_code,
          coupon_discount_value: coupon_discount_value,
          delivery_charges: delivery_charges,
          extra_services_charges: extra_services_charges,
          item_pricing: item_pricing,
          addon_charges: addon_charges,
          total_amount: total_amount,
          total_billed_amount: total_billed_amount,
        },
      ],
      { session }
    );

    if (!orderInsert) {
      return sendRes(res, 400, {
        message: "Failed to create order",
      });
    }
    const orderItemsInsert = await OrderItems.create(
      [
        {
          order_id: orderInsert[0]._id.toString(),
          no_of_people: no_of_people,
          package_name: package_name,
          items: items,
          total_items_amount: total_items_amount,
        },
      ],
      { session }
    );
    if (!orderItemsInsert) {
      return sendRes(res, 400, {
        message: "Failed to create order items",
      });
    }

    await Cart.deleteOne({ _id: dbCartData?._id }, { session });
    await CartItems.deleteMany({ cart_id: dbCartData?._id }, { session });
    await remove(`cart-${id}`);

    await session.commitTransaction();

    return sendRes(res, 200, {
      message: "Order placed successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("Place Order Error:", err);
    sendError(res, err);
  }
};

//Get Order details
const getOrder = async (req, res) => {
  const { id } = req.user ?? {};
  try {
    if (!id) {
      return sendRes(res, 404, {
        message: "Customer id not found",
      });
    }
    const orderDetails = await Order.find({ customer_id: id }).lean();
    if (!orderDetails) {
      return sendRes(res, 404, {
        message: "Order not found",
      });
    }
    return sendRes(res, 200, {
      data: {
        orderDetails: orderDetails ?? {},
      },
      message: "Order fetched successfully",
    });
  } catch (err) {
    console.log("Get Order Error:", err);
    sendError(res, err);
  }
};

//Get Order info
const getOrderInfo = async (req, res) => {
  const { id } = req.user ?? {};
  const { order_id } = req.params;
  try {
    if (!id) {
      return sendRes(res, 404, {
        message: "Customer id not found",
      });
    }
    const orderDetails = await Order.findOne({ customer_id: id }).lean();
    if (!orderDetails) {
      return sendRes(res, 404, {
        message: "Order not found",
      });
    }
    return sendRes(res, 200, {
      data: {
        orderDetails: orderDetails ?? {},
      },
      message: "Order Info fetched successfully",
    });
  } catch (err) {
    console.log("Get Order Error:", err);
    sendError(res, err);
  }
};

module.exports = { placeOrder, getOrder, getOrderInfo };
