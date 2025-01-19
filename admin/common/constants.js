const orderSearchConstants = [
  "order_number",
  "name",
  "mobile_number",
  "from",
  "to",
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
