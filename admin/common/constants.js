const orderSearchConstants = [
  "order_number",
  "name",
  "mobile_number",
  "from",
  "to",
];
const customerSearchConstants = ["name", "mobile_number"];

const orderSortingConstants = ["created_at", "updated_at"];
const customerSortingConstants = ["name"];

module.exports = {
  orderSearchConstants,
  customerSearchConstants,
  orderSortingConstants,
  customerSortingConstants,
};
