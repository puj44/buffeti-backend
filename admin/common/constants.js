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

module.exports = {
  orderSearchConstants,
  customerSearchConstants,
  orderSortingConstants,
  customerSortingConstants,
};
