const { Cart, CartItems } = require("../db/models/cart");
const keys = require("../config/keys");
const { get } = require("./redisGetterSetter");
const moment = require("moment");

//Calculates the pricing of Cart items
async function calculateItems(data, itemsData) {
  let itemObject = {};
  const { location, menu_option, no_of_people, isValidPackage } = data ?? {};

  if (location && menu_option && itemsData && no_of_people) {
    for (const item in itemsData) {
      const itemData = itemsData[item];
      const additionalQty = Number(itemData?.additional_qty ?? 0);
      const extraItems = itemData?.added_extra_items;
      let totalPrice = 0,
        addonCharges = 0,
        extraChargesArray = [],
        extraCharges = 0;
      //ADDONCHARGE + ADDITIONAL QUANTITY
      addonCharges += itemData.additional_serving_rate * additionalQty; // ADDITIONAL RATE * ADDITIONAL QTY

      //EXTRACHARGESAMOUNT + EXTRA ITEMS ADDED
      if (extraItems && Object.keys(extraItems).length) {
        const extraItemsCacheData = await get(
          `${data.location}_${data.menu_option}_${keys.extra_items}`,
          true
        );

        for (const extraItm in extraItems) {
          const extraItem = extraItemsCacheData[extraItm]; //DATA FROM EXTRA ITEMS CACHE
          if (extraItem) {
            const price =
              Number(extraItem.rate_per_serving) *
              Number(extraItems[extraItm] ?? 0); // CALCULATE EXTRA ITEM PRICE RATE * QTY
            extraCharges += price;
            extraChargesArray.push({
              item_name: extraItem.item_name,
              qty: Number(extraItems[extraItm]),
              amount: price,
            });
          } else {
            return false;
          }
        }
      }
      // IN CASE OF CREATE CLICK2CATER OR SNACKBOX
      if (!isValidPackage) {
        totalPrice = itemData.rate_per_serving * data.no_of_people;
      }
      //SUMMATION OF ADDONCHARGES AND EXTRA ITEMS CHARGES
      totalPrice += addonCharges + extraCharges;
      itemObject[item] = {
        ...itemData,
        addon_charges: addonCharges,
        extra_charges: extraCharges,
        extra_charges_data: extraChargesArray,
        total_price: totalPrice,
      };
    }

    return { ...itemObject };
  } else {
    return false;
  }
}

//Get Cart Details
async function getCartDetails(customerId) {
  const cart = await Cart.findOne({ customer_id: customerId });
  if (cart && cart?._id) {
    const cartItems = await CartItems.find({ cart_id: cart?._id });
    if (cartItems?.length) {
      let items = {};
      cartItems.forEach((ci) => {
        const key = ci.package_name ?? cart.menu_option;
        items[key] = {
          cart_item_id: ci._id,
          no_of_people: ci.no_of_people,
        };
      });
      return {
        menu_option: cart.menu_option,
        items: items,
      };
    }
  }
  return {};
}

//Validate Package, in case of click2cater
async function validatePackage(items, isValidPackage, packages) {
  let isValid = false
  let categoriesMapings = packages.categories_mapping;
  let categorisedItems = {};
 
  for (const it in items) {
    if (items[it].category.slug) {
      categorisedItems[items[it].category.slug] =
        Number(categorisedItems[items[it].category.slug] ?? 0) + 1;
    }
  }
  if (JSON.stringify(categoriesMapings) == JSON.stringify(categorisedItems)) {
    isValid = true;
  }

  return isValid;
}

//Validate Delivery logic here
function validateDelivery(delivery_date, delivery_time) {
  const deliveryDateTime = moment(
    `${delivery_date} ${delivery_time}`,
    "YYYY-MM-DD HH:mm"
  );

  if (!deliveryDateTime.isValid()) {
    return { isValid: false, message: "Invalid delivery date or time" };
  }

  const now = moment();
  const startRange = moment().endOf("day");
  const endRange = moment().add(5, "days").endOf("day");

  if (deliveryDateTime.isSameOrBefore(startRange)) {
    return {
      isValid: false,
      message: "Delivery date and time must not be on the current day",
    };
  }

  if (deliveryDateTime.isAfter(endRange)) {
    return {
      isValid: false,
      message: "Delivery date and time must be within the next 5 days",
    };
  }

  return {
    isValid: true,
  };
}
module.exports = {
  getCartDetails,
  calculateItems,
  validatePackage,
  validateDelivery,
};
