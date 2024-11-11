const sendResponse = require("../../common/sendResponse");
const { Customer } = require("../../db/models/customers");

const getCustomers = async (req, res) => {
  const { search, sort } = req.query;
  const pipeline = {};
  let sortOption = {};
  try {
    if (search) {
      const [searchQuery, searchField] = search.split(",");

      query[searchField] = { $regex: searchQuery, $options: "i" };
    }
    if (sort) {
      const [sortField, sortOrder] = sort.split(",");
      sortOption[sortField] = sortOrder === "a" ? 1 : -1;
    }
    const allCustomers = await Customer.find(query).sort(sortOption).lean();

    if (!allCustomers.length) {
      return sendResponse(res, 404, { message: "No customers found" });
    }
    return sendResponse(res, 200, { customers: allCustomers });
  } catch (err) {
    console.log("Get Customers Err:", err);
    return sendResponse(res, 400, { message: err?.message });
  }
};

const getCustomerDetails = async (req, res) => {};

module.exports = { getCustomers, getCustomerDetails };
