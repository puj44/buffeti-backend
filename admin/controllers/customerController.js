const sendResponse = require("../../common/sendResponse");
const CustomersAddresses = require("../../db/models/customerAddresses");
const { Customers } = require("../../db/models/customers");

const getCustomers = async (req, res) => {
  const { search, sort, limit, page } = req.query;
  const query = {};
  const pipeline = [];
  let sortOption = {};
  try {
    if (search) {
      const [searchField, searchQuery] = search.split(",");
      query[searchField] = { $regex: `^${searchQuery}$`, $options: "i" };
      customerCheck = await Customers.findOne({
        [searchField]: {
          $regex: `^${searchQuery}$`,
          $options: "i",
        },
      });
      if (!customerCheck) {
        return sendResponse(res, 404, {
          message: `No customer found with ${searchField}: ${searchQuery}`,
        });
      }

      pipeline.push({ $match: query });
    }
    if (sort) {
      const [sortField, sortOrder] = sort.split(",");
      sortOption[sortField] = sortOrder === "a" ? 1 : -1;
    } else {
      sortOption = { createdAt: -1 };
    }
    pipeline.push({ $sort: sortOption });
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: pageSize });
    const allCustomers = await Customers.aggregate(pipeline);
    const countPipeline = pipeline.filter(
      (stage) => !("$skip" in stage || "$limit" in stage)
    );
    countPipeline.push({ $count: "totalDocuments" });

    const totalCountResult = await Customers.aggregate(countPipeline);
    const totalDocuments = totalCountResult[0]?.totalDocuments || 0;
    if (!allCustomers.length) {
      return sendResponse(res, 404, { message: "No customers found" });
    }
    return sendResponse(res, 200, {
      customers: allCustomers ?? {},
      pagination: {
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / pageSize),
        currentPage: pageNumber,
      },
    });
  } catch (err) {
    console.log("Get Customers Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

const getCustomerDetails = async (req, res) => {
  const customer_id = req.params.id;
  try {
    if (!customer_id) {
      return sendResponse(res, 404, { message: "customer id not found" });
    }

    const customerDetails = await Customers.findById({
      _id: customer_id,
    }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, { message: "Customer Details not found" });
    }

    const addressDetails = await CustomersAddresses.find({
      customer: customer_id,
    }).lean();

    if (!addressDetails) {
      return sendResponse(res, 404, {
        message: "No addresses found for this customer",
      });
    }
    return sendResponse(res, 200, {
      data: {
        customerDetails: customerDetails,
        CustomersAddresses: addressDetails,
      },
      message: "Customer info fetched successfully",
    });
  } catch (err) {
    console.log("Get Customer Details Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

module.exports = { getCustomers, getCustomerDetails };
