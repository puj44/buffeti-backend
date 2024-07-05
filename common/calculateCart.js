const { get } = require("./redisGetterSetter");
const { Cart, CartItems } = require("../db/models/cart");

const sendError = require("./sendError");
const sendRes = require("./sendResponse");
const { findItems } = require("./findItems");
const Packages = require("../db/models/packages");

//Validate Package, in case of click2cater
async function validatePackage(items, isValidPackage, packages) {
  let categoriesMapings = packages.categories_mapping;
  let categorisedItems = {};
  for (const it in items) {
    // console.log("HERE", it, items[it]);
    if (items[it].category.slug) {
      categorisedItems[items[it].category.slug] =
        Number(categorisedItems[items[it].category.slug] ?? 0) + 1;
    }
  }
  // console.log(
  //   JSON.stringify(categoriesMapings),
  //   "OBJECTS CAT",
  //   JSON.stringify(categorisedItems)
  // );
  if (JSON.stringify(categoriesMapings) === JSON.stringify(categorisedItems)) {
    isValidPackage = true;
  }

  // Object.keys(categoriesMapings).forEach((c) => {
  //   if (!items[c]) {
  //     isValidPackage = false;
  //   } else {
  //     if (Number(categoriesMapings[c]) !== Object.keys(items[c]).length) {
  //       isValidPackage = false;
  //     }
  //   }
  // });

  return isValidPackage;
}

//Calculates the pricing of Cart items
async function calculateItems(data, itemsData) {
  let additional_qty = null,
    extra_items = null,
    preparation = null,
    total_price = 0,
    addon_charges = 0,
    items_id,
    item_name,
    itemObj = {};

  console.log("itemsData:", itemsData);
  if (
    itemsData &&
    data.location &&
    data.menu_option &&
    itemsData &&
    data.no_of_people
  ) {
    switch (data.menu_option) {
      case "click2cater":
        itemsData.forEach(async (values, keys) => {
          additional_qty = values?.additional_qty;
          extra_items = values?.added_extra_items;
          preparation = values?.selected_preparation;
          extra_items_cache =
            extra_items !== null
              ? await get(
                  `${data.location}_${data.menu_option}_${keys.extra_items}`,
                  true
                )
              : null;

          if (additional_qty) {
            items_id = itemsData[i]._id;
            item_name = itemsData[i].item_name;
            addon_charges =
              addon_charges +
              itemsData[i].additional_serving_rate * additional_qty;
          }

          if (extra_items) {
            Object.keys(extra_items_cache).forEach((ec) => {
              Object.keys(extra_items).forEach((e) => {
                if (extra_items_cache[ec].slug === e) {
                  addon_charges =
                    addon_charges +
                    extra_items_cache[ec].rate_per_serving * extra_items[e];
                }
              });
            });
          }

          if (data.isValidPackage === false) {
            total_price = itemsData[i].rate_per_serving * data.no_of_people;
          }

          total_price += addon_charges;

          itemObj[key] = {
            ...itemsData[i],
            item_id: items_id,
            additional_qty: additional_qty,
            added_extra_items: extra_items,
            selected_preparation: preparation,
            addon_charges: addon_charges,
            total_price: total_price,
          };
        });

        break;

      case "snack-boxes":
        data.items.forEach((values, keys) => {
          values.forEach(async (value, key) => {
            Object.keys(itemsData).forEach((i) => {
              if (itemsData[i].slug === key) {
                items_id = itemsData[i]._id;
                total_price =
                  total_price +
                  itemsData[i].rate_per_serving * data.no_of_people;
              }
            });
            itemObj[key] = {
              ...itemsData[i],
              item_id: items_id,
              item_name: item_name,
              additional_qty: additional_qty,
              added_extra_items: extra_items,
              selected_preparation: preparation,
              addon_charges: addon_charges,
              total_price: total_price,
            };
          });
        });

        break;
      case "mini-meals":
        data.items.forEach((values, keys) => {
          values.forEach(async (value, key) => {
            Object.keys(itemsData).forEach((i) => {
              if (itemsData[i].slug === key) {
                items_id = itemsData[i]._id;
                total_price =
                  total_price + itemsData[i].price * data.no_of_people;
              }
            });
            itemObj[key] = {
              item_id: items_id,
              additional_qty: additional_qty,
              added_extra_items: extra_items,
              selected_preparation: preparation,
              addon_charges: addon_charges,
              total_price: total_price,
            };
          });
        });
        break;
    }
    return itemObj;
  } else {
    return false;
  }
}

//Calculates the pricing of whole Cart
async function calculateCart(id) {
  let cart, cartItems;
  //GET CART DATA
  cart = await Cart.findOne({ customer_id: id }).then((d) => d);
  if (!cart) {
    return false;
  }
  //GET CART ITEMS
  cartItems =
    cart.menu_option === "mini-meals"
      ? await CartItems.find({ cart_id: cart?._id })
          .lean()
          .then((d) => d) //If mini-meals then find all items from cart_id
      : await CartItems.findOne({ cart_id: cart?._id })
          .lean()
          .then((d) => d); //If not mini-meals then find one item from cart_id

  if (!cartItems) {
    return false;
  }

  const {
    menu_option,
    no_of_people,
    location,
    extra_services,
    delivery_address_id,
    delivery_date,
    delivery_time,
    cooking_instruction,
    coupon_code,
    delivery_charges,
  } = cart;

  let packagesData,
    itemsData,
    isValidPackage = false,
    total_items_amount = 0, //for click2cater
    total_amount = 0,
    gst = 5,
    total_billed_amount = 0,
    packagePrice = 0,
    addOnCharges = 0,
    addOnChargesQty = 0,
    cartData,
    itemObj,
    items_pricing = [],
    globalObj = {};

  const data = {
    items: cartItems?.items ?? {},
    menu_option: menu_option,
    no_of_people: no_of_people,
    isValidPackage: isValidPackage,
    location: location,
  };

  switch (menu_option) {
    case "mini-meals":
      const packagesInfo = await findItems(cartItems, menu_option);
      console.log("packagesInfo:", packagesInfo);
      if (packagesInfo) {
        for (const pack in packagesInfo) {
          const packageInfo = packagesInfo[pack];
          total_items_amount += Number(packageInfo.price);
          items_pricing.push({
            item_name: packageInfo?.item_name,
            amount: Number(packageInfo.price),
            qty: Number(packageInfo.no_of_people),
          });
        }
      }
      cartData = {
        items: packagesInfo,
      };
      break;
    default:
      const { no_of_people, package_name, items } = cartItems;
      itemsData = await findItems(items, menu_option);

      if (package_name) {
        packagesData = await Packages.findOne({ slug: package_name }).lean();
        isValidPackage = await validatePackage(
          itemsData,
          isValidPackage,
          packagesData
        );
      }

      //calculation of total items amount
      if (itemsData) {
        itemObj = await calculateItems(data, itemsData);
        //IF PACkAGE VALID, SUMMATION OF PACKAGE PRICE AND PUSH ONLY ONE TO ITEMS PRICING
        if (isValidPackage) {
          if (no_of_people >= 10 && no_of_people <= 20) {
            packagePrice = packagesData._10_20_pax;
          } else if (no_of_people >= 20 && no_of_people <= 30) {
            packagePrice = packagesData._20_30_pax;
          } else {
            packagePrice = packagesData._30_plus_pax;
          }
          total_items_amount += Number(packagePrice);
          //PUSH WHOLE PACKAGE
          items_pricing.push({
            item_name: packagesData?.package_name,
            amount: Number(packagePrice),
            qty: no_of_people,
          });
        }

        Object.keys(itemObj).forEach((i) => {
          const item = itemObj[i];
          total_items_amount += Number(item.total_price ?? 0);
          addOnCharges += Number(item.addon_charges ?? 0);
          addOnChargesQty += Number(item.additional_qty ?? 0);
          //INVALID PACKAGE, PUSH EACH ITEM DATA WITH PRCIE
          if (!isValidPackage) {
            items_pricing.push({
              item_name: item.item_name,
              amount:
                Number(item.total_price) - Number(item.addon_charges ?? 0), //REDUCE ADDON CHARGES FOR INDIVIDUAL ITEM TOTAL PRICE
              qty: no_of_people,
            });
          }
        });
      } else {
        return false;
      }
      cartData = {
        cart_item_id: cartItems?._id,
        package_name: package_name,
        no_of_people: no_of_people,
        items: itemObj,
      };

      break;
  }
  //GET TOTAL ITEMS AMOUNT
  total_amount = total_items_amount;
  //ADD DELIVERY CHARGES
  total_amount += Number(delivery_charges ?? 0);
  if (extra_services && extra_services?.length) {
    for (const service of extra_services) {
      //TODO: CREATE extra_services MODEL AND SEED(POPULATE DATA) & THEN SUMMATION IN total_amount
    }
  }
  total_billed_amount += total_amount + (total_amount * gst) / 100;
  globalObj = {
    cart_id: cart?._id,
    menu_option: menu_option,
    delivery_address_id: delivery_address_id,
    cart_data: cartData,
    delivery_date: delivery_date,
    delivery_time: delivery_time,
    cooking_instruction: cooking_instruction,
    extra_services: extra_services,
    coupon_code: coupon_code,
    billing_details: {
      item_pricing: items_pricing,
      addon_charges: {
        addOnCharges,
        addOnChargesQty,
      },
      total_amount: total_amount,
      total_billed_amount: total_billed_amount,
    },
  };

  return globalObj;
}

module.exports = {
  validatePackage,
  calculateItems,
  calculateCart,
};
