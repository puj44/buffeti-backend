const sendResponse = require("../../../common/sendResponse");
const {
  orderSearchConstants,
  customerSearchConstants,
  orderSortingConstants,
  customerSortingConstants,
  sortConstants,
} = require("../../common/constants");

const validateQueryParams = (entity) => (req, res, next) => {
  const { search, sort } = req.query;
  let searchConstants, sortingConstants;

  if (entity === "order") {
    searchConstants = orderSearchConstants;
    sortingConstants = orderSortingConstants;
  } else if (entity === "customer") {
    searchConstants = customerSearchConstants;
    sortingConstants = customerSortingConstants;
  } else {
    return sendResponse(res, 400, {
      message: `Invalid entity type for validation`,
    });
  }

  if (search) {
    const [searchField, searchQuery] = search.split(",");
    if (!searchConstants.includes(searchField)) {
      return sendResponse(res, 400, {
        message: `Invalid search Field: ${search}`,
      });
    }
  }

  if (sort) {
    let [sortField, sortOrder] = sort.split(",");

    if (!sortOrder) {
      sortOrder = "d";
    }

    if (
      !sortingConstants.includes(sortField) ||
      !sortConstants.includes(sortOrder)
    ) {
      return sendResponse(res, 400, {
        message: `Invalid sort field or order: ${sort}`,
      });
    }
  }

  next();
};

module.exports = { validateQueryParams };
