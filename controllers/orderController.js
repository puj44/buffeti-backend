const moment = require("moment");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { default: mongoose } = require("mongoose");
const { get, set, remove } = require("../common/redisGetterSetter");
const { Order, OrderItems } = require("../db/models/order");
const { Cart, CartItems } = require("../db/models/cart");
const { Customers } = require("../db/models/customers");
const { delivery_fees, mini_meals } = require("../config/keys");
const {
  generateOrderNumber,
  getCartDetails,
} = require("../common/commonHelper");
const { OrderPlacedSms } = require("../config/smsRequests");
const CustomersAddresses = require("../db/models/customerAddresses");
const slackLog = require("./utils/slackLog");

const placeOrder = async (req, res) => {
  const { id } = req.user ?? {};
  const { location } = req.headers;
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    // await remove(`cart-${id}`);
    if (!id) {
      return sendRes(res, 404, {
        message: "Customer id not found",
      });
    }
    let cartCacheData = await get(`cart-${id}`, true);
    console.log("cartCacheData", cartCacheData);

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
    const ordersCount = await Order.countDocuments({
      customer_id: id,
      menu_option: menu_option,
    });
    const order_number = generateOrderNumber(menu_option, ordersCount, id);
    const existingOrder = await Order.findOne({
      customer_id: id,
      order_number: order_number,
    });

    if (existingOrder) {
      return sendRes(res, 400, {
        message: "You have already placed an order!",
      });
    }

    let { items, no_of_people, package_name } = cart_data;

    if (!items && !no_of_people && !package_name) {
      Object.keys(cart_data).forEach((key) => {
        items = cart_data[key].items;
        no_of_people = cart_data[key].no_of_people;
        package_name = cart_data[key].package_name;
      });
    }

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
    const dbCartItemsData = await CartItems.find({
      cart_id: dbCartData?._id,
    }).lean();

    const db_delivery_address = await CustomersAddresses.findById(
      delivery_address_id
    ).lean();
    if (!db_delivery_address) {
      return sendRes(res, 400, {
        message: "Delivery address not found",
      });
    }

    let delivery_address =
      (db_delivery_address?.house_building_no ?? "") +
      " " +
      (db_delivery_address?.address ?? "") +
      " " +
      (db_delivery_address?.area ?? "") +
      " " +
      (db_delivery_address?.city ?? "") +
      " " +
      (db_delivery_address?.state ?? "") +
      " " +
      (db_delivery_address?.pincode ?? "");

    let total_profit = 0;

    if (menu_option === "mini-meals" && menu_option === "snack-boxes") {
      Object.keys(cart_data).forEach((key) => {
        let item_food_cost =
          cart_data[key].price -
          (cart_data[key].price * cart_data[key].food_cost) / 100;
        total_profit += item_food_cost * no_of_people;
      });
    } else {
      // Object.keys(cart_data).forEach((key) => {
      //   let item_food_cost =
      //     cart_data[key].price -
      //     (cart_data[key].price * cart_data[key].food_cost) / 100;
      //   total_profit += item_food_cost * no_of_people;
      // });
    }
    console.log("total_profit", total_profit);

    const orderInsert = await Order.create(
      [
        {
          order_number: order_number,
          customer_id: id,
          menu_option: menu_option,
          location: location,
          delivery_address_id: delivery_address_id,
          delivery_address: delivery_address,
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
          total_profit: total_profit,
          amount_due: total_billed_amount,
        },
      ],
      { session }
    );
    const orderItems = dbCartItemsData.map((d, idx) => {
      const info = JSON.parse(JSON.stringify(d));
      let obj = {
        order_id: orderInsert[0]._id.toString(),
        no_of_people: info?.no_of_people,
        package_name: info?.package_name,
        items: info?.items,
      };
      return obj;
    });
    if (!orderInsert) {
      return sendRes(res, 400, {
        message: "Failed to create order",
      });
    }
    const orderItemsInsert = await OrderItems.create(orderItems, { session });
    if (!orderItemsInsert) {
      return sendRes(res, 400, {
        message: "Failed to create order items",
      });
    }

    // await remove(`cart-${id}`);
    // await Cart.deleteOne({ _id: dbCartData?._id }, { session });
    // await CartItems.deleteMany({ cart_id: dbCartData?._id }, { session });

    // Send sms notification to customer

    const customerData = await Customers.findOne({ _id: id }).lean();
    if (!customerData) {
      return sendRes(res, 400, {
        message: "Customer data not found",
      });
    }
    const OrderPlacedSmsNotification = await OrderPlacedSms(
      customerData.name,
      order_number,
      customerData.mobile_number
    );

    if (!OrderPlacedSmsNotification) {
      return sendRes(res, 400, {
        message:
          "There is some problem sending the sms for the order confirmation!",
      });
    }

    await session.commitTransaction();
    const cartDetails = await getCartDetails(id);
    return sendRes(res, 200, {
      message: "Order placed successfully",
      data: {
        cartDetails: cartDetails ?? {},
        orderNumber: order_number,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    await slackLog("Place Order Error: ", err);
    return sendError(res, err);
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
    const orderDetails = await Order.find({ customer_id: id })
      .sort({ createdAt: -1 })
      .lean();
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
    await slackLog("Get Order Error: ", err);
    sendError(res, err);
  }
};

//Get Order info
const getOrderInfo = async (req, res) => {
  const { id } = req.user ?? {};
  const order_number = req.params.id;
  try {
    if (!id) {
      return sendRes(res, 404, {
        message: "Customer id not found",
      });
    }
    const orderCustomerCheck = await Order.findOne({ customer_id: id }).lean();
    if (!orderCustomerCheck) {
      return sendRes(res, 404, {
        message: "Order not found",
      });
    }

    const orderDetails = await Order.findOne({
      order_number: order_number,
    }).lean();
    if (!orderDetails) {
      return sendRes(res, 404, {
        message: "Order Details not found",
      });
    }

    const orderItemDetails = await OrderItems.find({
      order_id: orderDetails._id,
    }).lean();
    if (!orderItemDetails) {
      return sendRes(res, 404, {
        message: "Order Item Details not found",
      });
    }
    let totalNoOfPeople = 0;
    orderItemDetails.forEach((item) => {
      totalNoOfPeople += item.no_of_people;
    });

    return sendRes(res, 200, {
      data: {
        orderDetails: {
          ...orderDetails,
          no_of_people: totalNoOfPeople,
          delivery_address: orderDetails.delivery_address,
        },
      },
      message: "Order Info fetched successfully",
    });
  } catch (err) {
    console.log("Get Order Info Error:", err);
    await slackLog("Get Order Info Error: ", err);
    sendError(res, err);
  }
};

module.exports = { placeOrder, getOrder, getOrderInfo };
