const sendError = require("../../common/sendError");
const sendResponse = require("../../common/sendResponse");
const { Order } = require("../../db/models/order");
const { OrderPayment } = require("../../db/models/orderPayment");
const reader = require("xlsx");
const orderTransactionInfo = async (req, res) => {
  try {
    const { orderIds } = req.body;
    let response = [];
    if (orderIds?.length) {
      for (const orderId of orderIds) {
        const paymentDetails = await OrderPayment.findOne({
          razorpay_order_id: orderId,
        });
        let details = {};
        if (paymentDetails) {
          const numOfTxn = await OrderPayment.countDocuments({
            order_number: paymentDetails.order_number,
          });
          const orderPackage = await Order.findOne({
            order_number: paymentDetails.order_number,
          }).lean();
          let items = "";
          for (const item of orderPackage.item_pricing) {
            items = items.concat(" " + item.item_name);
          }
          details["order_id"] = orderId;
          details["order_number"] = paymentDetails.order_number;
          details["payment_status"] = paymentDetails.payment_status;
          details["amount"] = paymentDetails.payment_amount;
          details["number_of_times_transactions_performed"] = numOfTxn;
          details["products_info"] = items.trim();
          response.push(details);
        }
      }
    }
    if (response.length) {
      let workBook = reader.utils.book_new();
      const workSheet = reader.utils.json_to_sheet(response);
      reader.utils.book_append_sheet(workBook, workSheet, `response`);
      let exportFileName = `response.xlsx`;
      reader.writeFile(workBook, exportFileName);
    }
    return sendResponse(res, 200, { data: response });
  } catch (err) {
    console.log("Orders Info Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

const getOrders = async (req, res) => {
  const { search, sort } = req.query;
  const pipeline = {};
  let sortOption = {};
  try {
    if (search) {
      const [searchField, searchQuery] = search.split(",");

      if (searchField === "name" || searchField === "mobile_number") {
        pipeline.push(
          {
            $lookup: {
              from: "customers",
              localField: "customer_id",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $match: {
              "customer.0": { $exist: true },
              [`customer.${searchField}`]: {
                $regex: searchQuery,
                $options: "i",
              },
            },
          }
        );
      } else if (searchField === "from" || searchField === "to") {
        const date = moment(searchQuery, "YYYY-MM-DD").toDate();
        const dateQuery = {};
        if (searchField === "from") {
          dateQuery.$gte = date;
        } else if (searchField === "to") {
          dateQuery.$lte = date;
        }

        pipeline.push({
          $match: {
            updateAt: dateQuery,
          },
        });
      } else {
        pipeline.push({
          $match: {
            [searchField]: { $regex: searchQuery, $options: "i" },
          },
        });
      }
    }

    if (sort) {
      const [sortField, sortOrder] = sort.split(",");
      sortOption[sortField] = sortOrder === "a" ? 1 : -1;

      pipeline.push({
        $sort: sortOption,
      });
    }

    pipeline.push({ $project: { customer: 0 } });

    const allOrders = await Order.aggregate(pipeline);

    if (!allOrders.length) {
      return sendResponse(res, 404, { message: "No orders found" });
    }

    return sendResponse(res, 200, {
      data: {
        allOrders: allOrders ?? {},
      },
      message: "Orders fetched successfully",
    });
  } catch (err) {
    console.log("Get Orders Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

const getOrderInfo = async (req, res) => {
  const { id } = req.user ?? {};
  const order_number = req.params.id;
  try {
    if (!id) {
      return sendResponse(res, 404, { message: "Customer id not found" });
    }
    const orderCustomerCheck = await Order.findOne({ customer_id: id }).lean();
    if (!orderCustomerCheck) {
      return sendResponse(res, 404, {
        message: "No orders found for this customer",
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

    const orderPayments = await OrderPayment.find({
      order_number: order_number,
    }).lean();
    if (!orderPayments.length) {
      return sendResponse(res, 404, {
        message: "No payment details found for this order",
      });
    }

    return sendResponse(res, 200, {
      data: {
        orderDetails: orderDetails,
        orderPayments: orderPayments,
      },
      message: "Order info fetched successfully",
    });
  } catch (err) {
    console.log("Get Order Info Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

module.exports = { orderTransactionInfo, getOrders, getOrderInfo };
