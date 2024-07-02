const { get } = require("./redisGetterSetter");
const { Cart, CartItems } = require("../db/models/cart");

//Validate Package, in case of click2cater
async function validatePackage(items, isValidPackage, packages) {
  let values,
    categoriesMapings = packages.categories_mapping;

  Object.keys(categoriesMapings).forEach((c) => {
    if (!items[c]) {
      isValidPackage = false;
    } else {
      values = items[c];
      if (categoriesMapings[c] !== Object.keys(values).length) {
        isValidPackage = false;
      }
    }
  });

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
    items_name,
    itemObj = {};

  console.log(data.menu_option);
  if (
    data.items &&
    data.location &&
    data.menu_option &&
    itemsData &&
    data.no_of_people
  ) {
    switch (data.menu_option) {
      case "click2cater":
        data.items.forEach((values, keys) => {
          values.forEach(async (value, key) => {
            additional_qty = value?.additional_qty;
            extra_items = value?.added_extra_items;
            preparation = value?.selected_preparation;
            extra_items_cache =
              extra_items !== null
                ? await get(
                    `${data.location}_${data.menu_option}_${keys.extra_items}`,
                    true
                  )
                : null;

            Object.keys(itemsData).forEach((i) => {
              if (itemsData[i].slug === key) {
                if (additional_qty) {
                  items_id = itemsData[i]._id;
                  items_name = itemsData[i].name;
                  addon_charges =
                    addon_charges +
                    itemsData[i].additional_serving_rate * additional_qty;
                }
              }
            });

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
              item_id: items_id,
              item_name: items_name,
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
    return sendRes(res, 500, {
      message: "Couldn't find data",
    });
  }
}

//Calculates the pricing of whole Cart
async function calculatePricing(id) {
  let cart, cartItems;

  cart = await Cart.findOne({ customer_id: id }).then((d) => d);

  if (!cart) {
    return sendError(res, "Oops! There is nothing here!", 404);
  }

  cartItems = await CartItems.findOne({ cart_id: cart?._id }).then((d) => d);

  if (!cartItems) {
    return sendError(res, "Oops! There is nothing here!", 404);
  }

  const {
    menu_option,
    location,
    extra_services,
    delivery_address_id,
    delivery_date,
    delivery_time,
    cooking_instruction,
  } = cart;

  const { no_of_people, package_name, items } = cartItems;

  let packagesData,
    itemsData,
    miniMealsData,
    isValidPackage = true,
    total_items_amount = 0, //for click2cater
    total_amount = 0,
    gst = 5,
    total_billed_amount = 0,
    packagePrice = 0,
    itemObj;

  const data = {
    items: items,
    menu_option: menu_option,
    no_of_people: no_of_people,
    isValidPackage: isValidPackage,
    location: location,
  };

  const globalObj = {};

  switch (menu_option) {
    case "click2cater":
      if (package_name) {
        packagesData = await Packages.findOne({ slug: package_name }).then(
          (d) => d
        );
        isValidPackage = await validatePackage(
          items,
          isValidPackage,
          packagesData
        );
      }
      itemsData = await findItems(items, menu_option);

      //calculation of total amount
      if (itemsData && packagesData) {
        itemObj = await calculateItems(data);

        if (no_of_people >= 10 && no_of_people <= 20) {
          packagePrice = packagesData._10_20_pax;
        } else if (no_of_people >= 20 && no_of_people <= 30) {
          packagePrice = packagesData._20_30_pax;
        } else {
          packagePrice = packagesData._30_plus_pax;
        }

        Object.keys(itemObj).forEach((i) => {
          total_items_amount = total_items_amount + itemObj[i].total_price;
          globalObj[billing_details][item_pricing][amount] = total_items_amount;

          globalObj[billing_details][item_pricing][qty] +=
            itemObj[i].additional_qty + no_of_people;

          globalObj[billing_details][item_pricing][item_name] =
            itemObj[i].item_name;
        });
      } else {
        return sendRes(res, 500, {
          message: "Couldn't find data",
        });
      }
      if (isValidPackage) {
        total_amount += total_items_amount + packagePrice;
      }

      total_billed_amount += total_amount + (total_amount * gst) / 100;

      globalObj = {
        cart_id: cart?._id,
        menu_option: menu_option,
        delivery_address_id: delivery_address_id,
        cart_data: {
          cart_item_id: cartItems?._id,
          package_name: package_name,
          no_of_people: no_of_people,
          items: itemObj,
        },
        delivery_date: delivery_date,
        delivery_time: delivery_time,
        cooking_instruction: cooking_instruction,
        extra_services: extra_services,
        coupon_code: coupon_code,
        billing_details: {
          item_pricing: [
            {
              // "item_name":"",
              // "qty":"",
              // "amount":"[amount]"
            },
          ],
          total_amount: total_amount,
          total_billed_amount: total_billed_amount,
        },
      };

      break;
    case "snack-boxes":
      itemsData = await findItems(items, menu_option, package_name);
      if (itemsData) {
        itemObj = await calculateItems(data, itemsData);
        Object.keys(itemObj).forEach((i) => {
          total_amount += itemObj[i].total_price;
        });
      }

      globalObj = {
        cart_id: cart?._id,
        menu_option: menu_option,
        delivery_address_id: delivery_address_id,
        cart_data: {
          cart_item_id: cartItems?._id,
          package_name: package_name,
          no_of_people: no_of_people,
          items: itemObj,
        },
        delivery_date: delivery_date,
        delivery_time: delivery_time,
        cooking_instruction: cooking_instruction,
        extra_services: extra_services,
        coupon_code: coupon_code,
        billing_details: {
          item_pricing: [
            // {
            //     "item_name":"",
            //     "qty":"",
            //     "amount":"[amount]"
            // }
          ],
          total_amount: total_amount,
          total_billed_amount: total_billed_amount,
        },
      };

      break;
    case "mini-meals":
      itemsData = await findItems(items, menu_option, package_name);
      if (itemsData) {
        itemObj = await calculateItems(data, itemsData);
        Object.keys(itemObj).forEach((i) => {
          total_amount += itemObj[i].total_price;
        });
      }
      globalObj = {
        cart_id: cart?._id,
        menu_option: menu_option,
        delivery_address_id: delivery_address_id,
        cart_data: {
          items: {
            // "slug":{
            //     "cart_item_id",
            //     "qty",
            //     "package_name",
            //      "package_price"
            // },
            // "slug2":{
            //     "cart_item_id",
            //     "qty",
            //     "package_name",
            //     "package_price"
            // }
          },
        },
        delivery_date: delivery_date,
        delivery_time: delivery_time,
        cooking_instruction: cooking_instruction,
        extra_services: extra_services,
        coupon_code: coupon_code,
        billing_details: {
          item_pricing: [
            // {
            //     "item_name":"",
            //     "qty":"",
            //     "amount":"[amount]"
            // }
          ],
          total_amount: total_amount,
          total_billed_amount: total_billed_amount,
        },
      };

      break;
  }

  await Cart.deleteMany();
  await CartItems.deleteMany();

  return sendRes(res, 200, {
    globalObj,
  });
}

module.exports = {
  validatePackage,
  calculateItems,
  calculatePricing,
};
