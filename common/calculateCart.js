const { get } = require("./redisGetterSetter");
const { Cart, CartItems } = require("../db/models/cart");

const sendError = require("./sendError");
const sendRes = require("./sendResponse");
const { findItems } = require("./findItems");
const Packages = require("../db/models/packages");
const { calculateItems, validatePackage } = require("./commonHelper");
const { ExtraServices } = require("../db/models/extraServices");

//Calculates the pricing of whole Cart
async function calculateCart(id) {
  let cart, cartItems;
  //GET CART DATA
  cart = await Cart.findOne({ customer_id: id }).lean();
  if (!cart) {
    return null;
  }
  //GET CART ITEMS
  cartItems =
    cart.menu_option === "mini-meals"
      ? await CartItems.find({ cart_id: cart?._id }).lean() //If mini-meals then find all items from cart_id
      : await CartItems.findOne({ cart_id: cart?._id }).lean(); //If not mini-meals then find one item from cart_id

  if (!cartItems) {
    return null;
  }

  const {
    menu_option,
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
    cartData,
    itemObj,
    items_pricing = [],
    extra_charges = [],
    extra_services_charges = [],
    addOnCharges = 0,
    addOnChargesQty = 0,
    globalObj = {};

  switch (menu_option) {
    case "mini-meals":
      const packagesInfo = await findItems(cartItems, menu_option, location);
      if (packagesInfo) {
        for (const pack in packagesInfo) {
          const packageInfo = packagesInfo[pack];
          const totalPrice =
            Number(packageInfo.price) * Number(packageInfo.no_of_people);
          total_items_amount += totalPrice;
          items_pricing.push({
            item_name: packageInfo?.item_name,
            amount: totalPrice,
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
      itemsData = await findItems(items, menu_option, location);

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
        const calculcatedItems = await calculateItems(
          {
            menu_option: menu_option,
            location: location,
            no_of_people: no_of_people,
            isValidPackage: isValidPackage,
          },
          itemsData
        );
        //IF PACkAGE VALID, SUMMATION OF PACKAGE PRICE AND PUSH ONLY ONE TO ITEMS PRICING
        if (isValidPackage) {
          let packagePrice = 0;
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
        for (const i in calculcatedItems) {
          const item = calculcatedItems[i];
          total_items_amount += Number(item.total_price ?? 0);
          addOnCharges += Number(item.addon_charges ?? 0);
          addOnChargesQty += Number(item.additional_qty ?? 0);
          extra_charges = [
            ...extra_charges,
            ...(item.extra_charges_data ?? []),
          ];
          //INVALID PACKAGE, PUSH EACH ITEM DATA WITH PRICE
          if (!isValidPackage) {
            items_pricing.push({
              item_name: item.item_name,
              amount:
                Number(item.total_price) -
                Number(item.addon_charges ?? 0) -
                Number(item.extra_charges ?? 0), //REDUCE ADDON CHARGES FOR INDIVIDUAL ITEM TOTAL PRICE
              qty: no_of_people,
            });
          }
        }
        cartData = {
          cart_item_id: cartItems?._id,
          package_name: package_name,
          no_of_people: no_of_people,
          items: calculcatedItems,
        };
      } else {
        return null;
      }

      break;
  }
  //GET TOTAL ITEMS AMOUNT
  total_amount = total_items_amount;
  //ADD DELIVERY CHARGES
  total_amount += Number(delivery_charges ?? 0);

  if (extra_services && extra_services?.length) {
    for (const service of extra_services) {
      const extraService = await ExtraServices.findOne({ slug: service });
      extra_services_charges.push({
        name: extraService.name,
        price: extraService.price,
      });
      total_amount += Number(extraService.price);
    }
  }
  //TODO: coupon_code and delivery_charges caluction...
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
      extra_services_charges: extra_services_charges,
      item_pricing: items_pricing,
      addon_charges: {
        addOnCharges,
        addOnChargesQty,
      },
      extra_charges: extra_charges,
      total_amount: total_amount,
      total_billed_amount: total_billed_amount,
    },
  };

  return globalObj;
}

module.exports = {
  validatePackage,
  calculateCart,
};
