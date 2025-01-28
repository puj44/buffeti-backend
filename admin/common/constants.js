const orderSearchConstants = [
  "order_number",
  "name",
  "mobile_number",
  "from",
  "to",
  "order_status",
];
const customerSearchConstants = ["name", "mobile_number"];

const orderSortingConstants = ["createdAt", "updatedAt"];
const customerSortingConstants = ["name"];
const sortConstants = ["a", "d"];

const updateOrderStatusEnum = {
  placed: 0,
  confirmed: 1,
  preparing: 2,
  out_for_delivery: 3,
  cancelled: 4,
};

module.exports = {
  orderSearchConstants,
  customerSearchConstants,
  orderSortingConstants,
  customerSortingConstants,
  sortConstants,
  updateOrderStatusEnum,
};
