const { Cart, CartItems } = require("../db/models/cart");
const keys = require("../config/keys");
const { get } = require("./redisGetterSetter");
const moment = require("moment");
async function calculatePackages(itemsData) {
  try {
    let itemsPricing = [],
      totalItemsAmount = 0;
    for (const pack in itemsData) {
      const packageInfo = itemsData[pack];
      const totalPrice = Number(packageInfo.price * packageInfo.no_of_people);
      totalItemsAmount += totalPrice;
      itemsPricing.push({
        item_name: packageInfo?.item_name,
        amount: totalPrice,
        qty: Number(packageInfo.no_of_people),
      });
    }
    return { itemsPricing, totalItemsAmount };
  } catch (err) {
    console.log("CALCULATE PACKAGES ERROR:", err);
  }
}
//Calculates the pricing of Cart items
async function calculateItems(data, itemsData, packagesData) {
  let itemObject = {};

  let itemsPricing = [],
    extraChargesArray = [],
    addOnChargesSum = 0,
    addOnChargesQty = 0,
    totalItemsAmount = 0;
  try {
    const { location, menu_option, no_of_people, isPackageValid } = data ?? {};

    if (location && menu_option && itemsData && no_of_people) {
      if (isPackageValid) {
        let packagePrice = 0;
        if (no_of_people >= 10 && no_of_people <= 20) {
          packagePrice = packagesData._10_20_pax;
        } else if (no_of_people >= 20 && no_of_people <= 30) {
          packagePrice = packagesData._20_30_pax;
        } else {
          packagePrice = packagesData._30_plus_pax;
        }
        totalItemsAmount += packagePrice;
        itemsPricing.push({
          item_name: packagesData?.package_name,
          amount: Number(packagePrice),
          qty: no_of_people,
        });
      }
      for (const item in itemsData) {
        const itemData = itemsData[item];
        const additionalQty = Number(itemData?.additional_qty ?? 0);
        const extraItems = itemData?.added_extra_items;
        let totalPrice = 0,
          addonCharges = 0,
          extraCharges = 0;

        //ADDONCHARGE + ADDITIONAL QUANTITY
        addonCharges += Number(
          itemData.additional_serving_rate * additionalQty
        ); // ADDITIONAL RATE * ADDITIONAL QTY
        addOnChargesQty += additionalQty;
        //EXTRACHARGESAMOUNT + EXTRA ITEMS ADDED
        if (extraItems && Object.keys(extraItems).length) {
          let extraItemsCacheData = await get(
            `${data.location}_${data.menu_option}_${keys.extra_items}`,
            true
          );

          for (const extraItm in extraItems) {
            const extraItem = extraItemsCacheData[extraItm]; //DATA FROM EXTRA ITEMS CACHE
            if (extraItem) {
              const price = Number(
                extraItem.rate_per_serving * (extraItems[extraItm] ?? 0)
              ); // CALCULATE EXTRA ITEM PRICE RATE * QTY
              extraCharges += price;
              extraChargesArray.push({
                item_name: extraItem.item_name,
                qty: Number(extraItems[extraItm]),
                amount: price,
              });
            } else {
              return { error: true };
            }
          }
          extraItemsCacheData = {};
        }
        // IN CASE OF CREATE CLICK2CATER OR SNACKBOX
        if (!isPackageValid) {
          totalPrice = Number(itemData.rate_per_serving * no_of_people);
          itemsPricing.push({
            item_name: itemData.item_name,
            amount: Number(totalPrice),
            qty: no_of_people,
          });
        }
        //SUMMATION OF ADDONCHARGES AND EXTRA ITEMS CHARGES
        totalPrice += addonCharges + extraCharges;

        addOnChargesSum += addonCharges;
        totalItemsAmount += totalPrice;
        itemObject[item] = {
          ...itemData,
          addon_charges: addonCharges,
          extra_charges: extraCharges,
          total_price: totalPrice,
        };
      }

      return {
        itemsPricing,
        extraChargesArray,
        addOnChargesSum,
        addOnChargesQty,
        totalItemsAmount,
        calculatedItems: itemObject,
      };
    } else {
      return { error: true };
    }
  } catch (err) {
    console.log("CALCULATE ITEMS ERROR:", err);
    return { error: true };
  }
}

//Get Cart Details
async function getCartDetails(customerId, data = null) {
  // const cart = await Cart.findOne({ customer_id: customerId });
  try {
    const currentCartData = data ?? (await get(`cart-${customerId}`, true));
    if (currentCartData) {
      if (
        currentCartData?.cart_data &&
        Object.keys(currentCartData?.cart_data)?.length
      ) {
        let items = {};
        if (currentCartData?.menu_option !== "mini-meals") {
          items[currentCartData?.cart_data?.package_name] = {
            cart_item_id: currentCartData?.cart_data?.cart_item_id,
            no_of_people: currentCartData?.cart_data?.no_of_people,
          };
        } else {
          Object.keys(currentCartData?.cart_data).forEach((ci) => {
            items[ci] = {
              cart_item_id: currentCartData?.cart_data[ci]?.cart_item_id,
              no_of_people: currentCartData?.cart_data[ci]?.no_of_people,
            };
          });
        }
        return {
          menu_option: currentCartData.menu_option,
          items: items,
        };
      }
    }
  } catch (err) {
    console.log("GET CART DETAILS:", err);
  }
  return {};
}

//Validate Package, in case of click2cater
async function validatePackage(items, packages) {
  let isValid = false;
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

const generateOrderNumber = (menuOption, currentOrderCount) => {
  let orderNumber =
    menuOption === "snack-boxes"
      ? "SB"
      : menuOption === "mini-meals"
      ? "MM"
      : "C2C";
  const number =
    currentOrderCount + 1 < 10
      ? `0${currentOrderCount + 1}`
      : currentOrderCount + 1;
  orderNumber = orderNumber.concat(number);
  return orderNumber;
};

module.exports = {
  getCartDetails,
  calculateItems,
  validatePackage,
  validateDelivery,
  calculatePackages,
  generateOrderNumber,
};
