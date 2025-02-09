const sendError = require("../../common/sendError");
const sendResponse = require("../../common/sendResponse");
const slackLog = require("../../controllers/utils/slackLog");
const { Customers } = require("../../db/models/customers");
const { Order, OrderItems } = require("../../db/models/order");
const { OrderPayment } = require("../../db/models/orderPayment");
const reader = require("xlsx");
const { updateOrderStatusEnum } = require("../common/constants");
const { OrderStatusEmailNotification } = require("../../config/emailRequests");
const moment = require("moment");
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

// const getOrders = async (req, res) => {
//   const { search, sort, limit, page, order_status } = req.query;
//   const pipeline = [];
//   let sortOption = {};
//   let customerCheck = {};
//   try {
//     if (search) {
//       const [searchField, searchQuery] = search.split(",");
//       if (searchField === "name" || searchField === "mobile_number") {
//         pipeline.push(
//           {
//             $lookup: {
//               from: "customers",
//               localField: "customer_id",
//               foreignField: "_id",
//               as: "customer",
//             },
//           },
//           {
//             $addFields: {
//               // Convert mobile_number to string for regex matching
//               "customer.mobile_number_str": {
//                 $toString: { $arrayElemAt: ["$customer.mobile_number", 0] },
//               },
//             },
//           },
//           {
//             $match: {
//               "customer.0": { $exists: true },
//               ...(searchField === "mobile_number"
//                 ? {
//                     "customer.mobile_number_str": {
//                       $regex: `^${searchQuery}$`,
//                       $options: "i",
//                     },
//                   }
//                 : {
//                     [`customer.${searchField}`]: {
//                       $regex: `^${searchQuery}$`,
//                       $options: "i",
//                     },
//                   }),
//             },
//           }
//         );
//         customerCheck = await Customers.findOne({
//           ...(searchField === "mobile_number"
//             ? {
//                 mobile_number: searchQuery, // Compare as number in Mongoose query
//               }
//             : {
//                 [searchField]: {
//                   $regex: `^${searchQuery}$`,
//                   $options: "i",
//                 },
//               }),
//         });

//         if (!customerCheck) {
//           return sendResponse(res, 404, {
//             message: `No customer found with ${searchField}: ${searchQuery}`,
//           });
//         }
//       }

//       if (searchField === "order_number") {
//         pipeline.push({
//           $match: {
//             order_number: {
//               $regex: `^${searchQuery}$`,
//               $options: "i",
//             },
//           },
//         });
//         orderCheck = await Order.findOne({
//           [searchField]: {
//             $regex: `^${searchQuery}$`,
//             $options: "i",
//           },
//         });

//         if (!orderCheck) {
//           return sendResponse(res, 404, {
//             message: `No order found with ${searchField}: ${searchQuery}`,
//           });
//         }
//       }
//       if (searchField === "from" || searchField === "to") {
//         const date = moment(searchQuery, "YYYY-MM-DD").toDate();
//         if (!moment(date).isValid()) {
//           return sendResponse(res, 400, { message: "Invalid date format" });
//         }
//         const dateQuery = {};
//         if (searchField === "from") {
//           dateQuery.$gte = date;
//         } else if (searchField === "to") {
//           dateQuery.$lte = date;
//         }
//         pipeline.push({
//           $match: {
//             createdAt: dateQuery,
//           },
//         });
//       }
//     }
//     if (order_status) {
//       pipeline.push({
//         $match: {
//           order_status: order_status,
//         },
//       });
//     }
//     if (sort) {
//       const [sortField, sortOrder] = sort.split(",");
//       sortOption[sortField] = sortOrder === "a" ? 1 : -1;
//     } else {
//       sortOption = { createdAt: -1 };
//     }

//     pipeline.push({ $sort: sortOption });

//     const pageNumber = parseInt(page, 10) || 1;
//     const pageSize = parseInt(limit, 10) || 10;

//     if (pageNumber <= 0 || pageSize <= 0) {
//       return sendResponse(res, 400, {
//         message: "Page and limit must be greater than 0.",
//       });
//     }
//     const skip = (pageNumber - 1) * pageSize;

//     pipeline.push({ $skip: skip });
//     pipeline.push({ $limit: pageSize });

//     pipeline.push(
//       {
//         $lookup: {
//           from: "customers",
//           localField: "customer_id",
//           foreignField: "_id",
//           as: "customer",
//         },
//       },
//       {
//         $addFields: {
//           customer_name: { $arrayElemAt: ["$customer.name", 0] }, // Extract the customer's name
//           customer_mobile_number: {
//             $arrayElemAt: ["$customer.mobile_number", 0],
//           }, // Extract the customer's mobile number
//         },
//       },
//       {
//         $project: {
//           customer_name: 1,
//           customer_mobile_number: 1,
//           order_number: 1,
//           menu_option: 1,
//           location: 1,
//           delivery_address: 1,
//           delivery_date: 1,
//           delivery_time: 1,
//           total_amount: 1,
//           cooking_instruction: 1,
//           coupon_code: 1,
//           coupon_discount_value: 1,
//           delivery_charges: 1,
//           order_status: 1,
//           payment_status: 1,
//           payment_mode: 1,
//           payment_type: 1,
//           total_amount: 1,
//           total_billed_amount: 1,
//           amount_due: 1,
//           updatedAt: 1,
//           createdAt: 1,
//         },
//       }
//     );

//     const allOrders = await Order.aggregate(pipeline);

//     const countPipeline = pipeline.filter(
//       (stage) => !("$skip" in stage || "$limit" in stage)
//     );
//     countPipeline.push({ $count: "totalDocuments" });

//     const totalCountResult = await Order.aggregate(countPipeline);
//     const totalDocuments = totalCountResult[0]?.totalDocuments || 0;
//     const totalPages = Math.ceil(totalDocuments / pageSize);
//     if (pageNumber > totalPages && totalPages > 0) {
//       return sendResponse(res, 400, {
//         message: `Page number exceeds total pages. Max page: ${totalPages}`,
//       });
//     }
//     if (totalDocuments === 0) {
//       return sendResponse(res, 404, { message: "No customers found." });
//     }

//     if (!allOrders.length) {
//       return sendResponse(res, 404, { message: "No orders found" });
//     }
//     return sendResponse(res, 200, {
//       data: {
//         allOrders: allOrders ?? {},
//         pagination: {
//           totalDocuments,
//           totalPages,
//           currentPage: pageNumber,
//           pageSize,
//         },
//       },
//       message: "Orders fetched successfully",
//     });
//   } catch (err) {
//     console.log("Get Orders Err:", err);
//     return sendResponse(res, 400, { message: err?.message });
//   }
// };

const getOrders = async (req, res) => {
  const { search, sort, limit, page, from, to, order_status } = req.query;
  const pipeline = [];
  let sortOption = {};

  try {
    if (search) {
      const [searchField, searchQuery] = search.split(",");

      if (searchField === "name") {
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
              "customer.0": { $exists: true },
              "customer.name": { $regex: searchQuery, $options: "i" },
            },
          }
        );
      } else if (searchField === "mobile_number") {
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
              "customer.0": { $exists: true },
              $expr: {
                $regexMatch: {
                  input: {
                    $toString: { $arrayElemAt: ["$customer.mobile_number", 0] },
                  },
                  regex: searchQuery,
                  options: "i",
                },
              },
            },
          }
        );
      }
      if (searchField === "order_number") {
        pipeline.push({
          $match: { order_number: { $regex: searchQuery, $options: "i" } },
        });
      }
    }
    if (order_status) {
      pipeline.push({
        $match: { order_status: { $regex: order_status, $options: "i" } },
      });
    }

    const dateFilter = {};
    if (from) {
      const fromDate = moment(from, "DD-MM-YYYY").startOf("day").toDate();
      if (!moment(fromDate).isValid()) {
        return sendResponse(res, 400, {
          message: "Invalid 'from' date format",
        });
      }
      dateFilter.$gte = fromDate;
    }
    if (to) {
      const toDate = moment(to, "DD-MM-YYYY").endOf("day").toDate();
      if (!moment(toDate).isValid()) {
        return sendResponse(res, 400, { message: "Invalid 'to' date format" });
      }
      dateFilter.$lte = toDate;
    }
    if (Object.keys(dateFilter).length) {
      pipeline.push({ $match: { createdAt: dateFilter } });
    }

    if (sort) {
      const [sortField, sortOrder] = sort.split(",");
      if (["createdAt", "updatedAt"].includes(sortField)) {
        sortOption[sortField] = sortOrder === "a" ? 1 : -1;
      }
      pipeline.push({
        $sort: sortOption,
      });
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    pipeline.push({ $skip: (pageNumber - 1) * pageSize }, { $limit: pageSize });

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
        $addFields: {
          customer_name: { $arrayElemAt: ["$customer.name", 0] },
          customer_mobile_number: {
            $arrayElemAt: ["$customer.mobile_number", 0],
          },
        },
      },
      {
        $project: {
          customer_name: 1,
          customer_mobile_number: 1,
          order_number: 1,
          menu_option: 1,
          location: 1,
          delivery_address: 1,
          delivery_date: 1,
          delivery_time: 1,
          total_amount: 1,
          cooking_instruction: 1,
          coupon_code: 1,
          coupon_discount_value: 1,
          delivery_charges: 1,
          order_status: 1,
          payment_status: 1,
          payment_mode: 1,
          payment_type: 1,
          total_amount: 1,
          total_billed_amount: 1,
          amount_due: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      }
    );

    const allOrders = await Order.aggregate(pipeline);

    const countPipeline = pipeline.filter(
      (stage) => !("$skip" in stage || "$limit" in stage)
    );
    countPipeline.push({ $count: "totalDocuments" });

    const totalCountResult = await Order.aggregate(countPipeline);
    const totalDocuments = totalCountResult[0]?.totalDocuments || 0;
    const totalPages = Math.ceil(totalDocuments / pageSize);
    if (pageNumber > totalPages && totalPages > 0) {
      return sendResponse(res, 400, {
        message: `Page number exceeds total pages. Max page: ${totalPages}`,
      });
    }

    return sendResponse(res, 200, {
      data: {
        allOrders,
        pagination: {
          totalDocuments,
          totalPages,
          currentPage: pageNumber,
          pageSize,
        },
      },
      message: "Orders fetched successfully",
    });
  } catch (err) {
    console.log("Get Orders Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

const getOrderInfo = async (req, res) => {
  const order_number = req.params.id;
  try {
    if (!order_number) {
      return sendRes(res, 404, {
        message: "Order Number not found",
      });
    }

    const orderDetails = await Order.findOne({
      order_number: order_number,
    }).lean();
    if (!orderDetails) {
      return sendRes(res, 404, {
        message: "Order Details not found for this order",
      });
    }

    const customerDetails = await Customers.findOne({
      _id: orderDetails.customer_id,
    }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer Details not found for this order",
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

    const orderPayments = await OrderPayment.find({
      order_number: order_number,
    }).lean();
    // if (!orderPayments.length) {
    //   return sendResponse(res, 404, {
    //     message: "No payment details found for this order",
    //   });
    // }

    return sendResponse(res, 200, {
      data: {
        customerDetails: {
          name: customerDetails.name,
          mobile_number: customerDetails.mobile_number,
        },
        orderDetails: {
          ...orderDetails,
          no_of_people: totalNoOfPeople,
        },
        orderPayments: orderPayments,
      },
      message: "Order info fetched successfully",
    });
  } catch (err) {
    console.log("Get Order Info Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { order_number, order_status } = req.body;
  try {
    if (!order_number || !order_status) {
      return sendResponse(res, 400, {
        message: "Order Number and Order Status are required",
      });
    }
    const orderDetails = await Order.findOne({
      order_number: order_number,
    }).lean();
    if (!orderDetails) {
      return sendResponse(res, 404, {
        message: "No order found with this order number",
      });
    }

    if (order_status === orderDetails.order_status) {
      return sendResponse(res, 400, {
        message: `${order_status} already exists`,
      });
    } else {
      if (
        updateOrderStatusEnum[order_status] >
        updateOrderStatusEnum[orderDetails.order_status]
      ) {
        if (
          (orderDetails.order_status === "out_for_delivery" ||
            orderDetails.order_status === "delivered") &&
          order_status === "cancelled"
        ) {
          return sendResponse(res, 400, {
            message: `Cannot update status to cancelled. Current status is ${orderDetails?.order_status}`,
          });
        }
        const orderStatusUpdate = await Order.findOneAndUpdate(
          {
            order_number: order_number,
          },
          {
            order_status: order_status,
          }
        );
        if (!orderStatusUpdate) {
          return sendResponse(res, 500, {
            message: "Failed to update order status",
          });
        }
      } else {
        return sendResponse(res, 400, {
          message: `Cannot update status to ${order_status}. Current status is ${orderDetails?.order_status}`,
        });
      }
    }

    //TODO: email notification to user
    const customerDetails = await Customers.findOne({
      _id: orderDetails.customer_id,
    }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer Details not found for this order",
      });
    }

    const emailNotifyRes = await OrderStatusEmailNotification(
      customerDetails.name,
      order_number,
      customerDetails.email,
      order_status
    );

    if (!emailNotifyRes) {
      return sendResponse(res, 404, {
        message: "Couldn't sent email notification!",
      });
    }

    return sendResponse(res, 200, {
      message: "Order status updated successfully",
    });
  } catch (err) {
    console.log("Update Order Status Err:", err);
    // await slackLog("UPDATE_ORDER_STATUS", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

module.exports = {
  orderTransactionInfo,
  getOrders,
  getOrderInfo,
  updateOrderStatus,
};
