const {
  orderSearchConstants,
  customerSearchConstants,
  orderSortingConstants,
  customerSortingConstants,
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
    return {
      status: 400,
      message: `Invalid entity type for validation`,
    };
  }

  if (search) {
    const [searchField, searchQuery] = search.split(",");
    if (!searchConstants.includes(searchField)) {
      return {
        status: 400,
        message: `Invalid search query: ${searchQuery}`,
      };
    }
  }

  if (sort) {
    const [sortField, sortOrder] = sort.split(",");
    if (
      !sortingConstants.includes(sortField) ||
      !["d", "a"].includes(sortOrder)
    ) {
      return {
        status: 400,
        message: `Invalid sort field or order: ${sort}`,
      };
    }
  }

  next();
};

module.exports = { validateQueryParams };
