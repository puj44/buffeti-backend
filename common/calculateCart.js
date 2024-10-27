const { get, set } = require("./redisGetterSetter");
const { Cart, CartItems } = require("../db/models/cart");

const sendError = require("./sendError");
const sendRes = require("./sendResponse");
const { findItems, findMiniMeals } = require("./findItems");
const Packages = require("../db/models/packages");
const {
  calculateItems,
  validatePackage,
  calculatePackages,
} = require("./commonHelper");
const { ExtraServices } = require("../db/models/extraServices");
const CouponCodes = require("../db/models/couponCode");
const Items = require("../db/models/items");

const calculateFromItemsAmount = async (data, cartData) => {
  //TODO: add delivery charges and add it in amount
  try {
    let billingDetails = data;
    let extra_services_charges = [];
    billingDetails.total_amount = billingDetails?.total_items_amount;
    if (cartData?.extra_services && cartData?.extra_services?.length) {
      for (const service of cartData?.extra_services) {
        const extraService = await ExtraServices.findOne({ slug: service });
        extra_services_charges.push({
          name: extraService.name,
          price: extraService.price,
        });
        billingDetails.total_amount += Number(extraService.price);
      }
    }
    let coupon_type = null;
    let coupon_discount = null;
    let coupon_discount_value = null;
    if (cartData?.coupon_code && cartData?.coupon_code !== null) {
      const couponData = await CouponCodes.findOne({
        coupon_code: cartData?.coupon_code,
        is_active: true,
      });
      coupon_type = couponData.discount_type;
      coupon_discount = couponData.discount_value;
      let couponVal = 0;
      if (couponData.discount_type === "PCT") {
        couponVal =
          (billingDetails.total_amount * couponData.discount_value) / 100;
      } else {
        couponVal = couponData.discount_value;
      }
      coupon_discount_value = couponVal;
      billingDetails.total_amount = Number(
        billingDetails?.total_amount - coupon_discount_value
      );
    }

    billingDetails.coupon_type = coupon_type;
    billingDetails.coupon_discount = coupon_discount;
    billingDetails.coupon_discount_value = coupon_discount_value;
    billingDetails.total_billed_amount = Math.ceil(
      billingDetails.total_amount + (billingDetails.total_amount * 5) / 100
    );
    if (cartData?.delivery_charges && cartData?.delivery_charges !== null) {
      billingDetails.total_amount += Number(cartData?.delivery_charges);
    }
    billingDetails.extra_services_charges = extra_services_charges;
    return billingDetails;
  } catch (err) {
    console.log("CALCULATE CART FROM ITEMS:", err);
    return {};
  }
};

const addCouponCodeCache = async (customerId, code) => {
  try {
    let cartData = await get(`cart-${customerId}`, true);
    cartData.coupon_code = code;
    const billingDetails = cartData.billing_details;
    cartData.billing_details = await calculateFromItemsAmount(
      billingDetails,
      cartData
    );
    await set(`cart-${customerId}`, cartData, true);
    return cartData;
  } catch (err) {
    console.log("ADD COUPON CACHE:", err);
    return false;
  }
};

const removeCouponCodeCache = async (customerId) => {
  try {
    let cartData = await get(`cart-${customerId}`, true);
    cartData.coupon_code = null;
    const billingDetails = cartData.billing_details;
    cartData.billing_details = await calculateFromItemsAmount(
      billingDetails,
      cartData
    );
    await set(`cart-${customerId}`, cartData, true);
    return cartData;
  } catch (err) {
    console.log("REMOVE COUPON CACHE:", err);
    return false;
  }
};

const updateCartCache = async (customerId, newCartData, data = null) => {
  try {
    let cartData = data ?? (await get(`cart-${customerId}`, true));
    cartData = {
      ...cartData,
      ...(newCartData ?? {}),
    };
    let billingDetails = cartData.billing_details ?? {};

    cartData.billing_details = await calculateFromItemsAmount(
      billingDetails,
      cartData
    );
    return cartData;
  } catch (err) {
    console.log("UPDATE CART CACHE:", err);
    return false;
  }
};

const deleteCartItemCache = async (customerId, packageName) => {
  try {
    let cartData = await get(`cart-${customerId}`, true);
    const reducePrice = Number(
      (cartData.cart_data?.[packageName]?.price ?? 0) *
        (cartData.cart_data?.[packageName]?.no_of_people ?? 0)
    );
    let billingDetails = cartData.billing_details;
    billingDetails.total_items_amount = Number(
      billingDetails.total_items_amount - reducePrice
    );

    cartData.billing_details = await calculateFromItemsAmount(
      billingDetails,
      cartData
    );
    await set(`cart-${customerId}`, cartData, true);
    return cartData;
  } catch (err) {
    console.log("DELETE CART ITEM CACHE:", err);
    return false;
  }
};

const updateCartItemsCache = async (customerId, newCartItems, data = null) => {
  try {
    let cartData = data ?? (await get(`cart-${customerId}`, true));
    if (cartData.menu_option !== "mini-meals") {
      cartData.cart_data.no_of_people = newCartItems.no_of_people;
      // cartData.cart_data.items = newCartItems.items;
      const packagesData = await Packages.findOne({
        slug: cartData.cart_data.package_name,
        menu_option: cartData.menu_option,
      }).lean();
      let isPackageValid = false;
      if (packagesData) {
        isPackageValid = await validatePackage(
          newCartItems.items,
          packagesData
        );
      }
      const {
        itemsPricing,
        extraChargesArray,
        addOnChargesSum,
        addOnChargesQty,
        totalItemsAmount,
        calculatedItems,
        error,
      } = await calculateItems(
        {
          location: cartData.location,
          menu_option: cartData.menu_option,
          no_of_people: cartData.cart_data.no_of_people,
          isPackageValid,
        },
        newCartItems.items,
        packagesData
      );

      if (error) {
        return false;
      }
      cartData.cart_data.items = calculatedItems;

      cartData.billing_details = {
        ...cartData.billing_details,
        item_pricing: itemsPricing,
        addon_charges: {
          addOnCharges: addOnChargesSum ?? 0,
          addOnChargesQty: addOnChargesQty ?? 0,
        },
        extra_charges: extraChargesArray,
        total_amount: totalItemsAmount,
        total_items_amount: totalItemsAmount,
      };
    } else {
      cartData.cart_data[newCartItems.package_name] = {
        ...cartData.cart_data[newCartItems.package_name],
        no_of_people: newCartItems.no_of_people,
      };
      const { itemsPricing, totalItemsAmount } = await calculatePackages(
        cartData.cart_data
      );

      cartData.billing_details = {
        ...cartData.billing_details,
        item_pricing: itemsPricing,
        total_items_amount: totalItemsAmount,
      };
    }
    return cartData;
  } catch (err) {
    console.log("UPDATE CART ITEMS CACHE:", err);
    return false;
  }
};

const addToCurrentCartCache = async (data, customerId) => {
  const { cart_id, cart_item_id, no_of_people, package_name } = data;
  try {
    let currentCartData = await get(`cart-${customerId}`, true);
    const newCartItem = [
      {
        _id: cart_item_id,
        no_of_people: no_of_people,
        package_name: package_name,
      },
    ];
    const cartItemValues = await findMiniMeals(newCartItem);
    const currentValue = cartItemValues[package_name];

    if (cartItemValues && currentCartData) {
      currentCartData.cart_data = {
        ...currentCartData.cart_data,
        [package_name]: currentValue,
      };
      const totalPrice = Number(currentValue.price * currentValue.no_of_people);

      let billingDetails = currentCartData?.billing_details;
      billingDetails.item_pricing.push({
        item_name: currentValue?.item_name,
        amount: totalPrice,
        qty: Number(currentValue.no_of_people),
      });

      billingDetails.total_amount = Number(
        billingDetails.total_amount + totalPrice
      );
      billingDetails.total_billed_amount = Math.ceil(
        billingDetails.total_billed_amount + totalPrice
      );
      currentCartData.billing_details = billingDetails;
      await set(`cart-${customerId}`, currentCartData, true);
    }
  } catch (err) {
    console.log("ADD MORE TO CART CACHE:", err);
    return false;
  }
};

const addCartToCache = async (data, customerId) => {
  const {
    cart_id,
    cart_item_id,
    location,
    menu_option,
    no_of_people,
    items,
    package_name,
  } = data;
  let globalData = {};

  let cartItemValues = {};
  let isPackageValid = false;
  let billingDetails = {};
  try {
    if (menu_option !== "mini-meals") {
      for (const item in items) {
        const currentItemValues = JSON.parse(
          JSON.stringify(items[item] ?? false)
        );
        const dbItem = JSON.parse(
          JSON.stringify((await Items.findOne({ slug: item }).lean()) ?? {})
        );
        if (Object.keys(dbItem ?? {}).length < 0) {
          return false;
        }

        delete dbItem._id;
        delete dbItem.__v;
        delete dbItem.createdAt;
        delete dbItem.updatedAt;
        cartItemValues[item] = {
          ...dbItem,
          additional_qty: currentItemValues.additional_qty ?? 0,
          added_extra_items: currentItemValues.added_extra_items ?? {},
          selected_preparation: currentItemValues.selected_preparation
            ? currentItemValues.selected_preparation
            : Object.keys(dbItem.preparations ?? {}).length > 0
            ? Object.keys(dbItem.preparations)[0]
            : null,
        };
      }
      const packagesData = await Packages.findOne({
        slug: package_name,
        menu_option: menu_option,
      }).lean();
      if (packagesData) {
        isPackageValid = await validatePackage(cartItemValues, packagesData);
      }
      const deliveryCharges = 0;

      const {
        itemsPricing,
        extraChargesArray,
        addOnChargesSum,
        addOnChargesQty,
        totalItemsAmount,
        calculatedItems,
        error,
      } = await calculateItems(
        { location, menu_option, no_of_people, isPackageValid },
        cartItemValues,
        packagesData
      );
      if (error) {
        return false;
      }
      cartItemValues = {
        cart_item_id: cart_item_id,
        package_name: package_name,
        no_of_people: no_of_people,
        items: calculatedItems,
      };
      billingDetails = {
        item_pricing: itemsPricing,
        addon_charges: {
          addOnCharges: addOnChargesSum ?? 0,
          addOnChargesQty: addOnChargesQty ?? 0,
        },
        extra_charges: extraChargesArray,
        delivery_charges: deliveryCharges, // delivery charges
        total_amount: totalItemsAmount,
        total_items_amount: totalItemsAmount,
      };
    } else {
      cartItemValues = await findMiniMeals(items);
      const { itemsPricing, totalItemsAmount } = await calculatePackages(
        cartItemValues
      );
      billingDetails = {
        item_pricing: itemsPricing,
        total_items_amount: totalItemsAmount,
        total_amount: totalItemsAmount,
      };
    }
    //TODO: Coupon code charges, extra services, delivery charges(centralize)
    billingDetails.total_billed_amount = Math.ceil(
      billingDetails.total_amount + (billingDetails.total_amount * 5) / 100
    );
    //add same calculateFromItemsAmount here and also in addToCurrentCartCache
    globalData = {
      cart_id: cart_id,
      location: location,
      menu_option: menu_option,
      cart_data: cartItemValues,
      billing_details: billingDetails,
    };
    await set(`cart-${customerId}`, globalData, true);
    return true;
  } catch (err) {
    console.log("ADD TO CART CACHE:", err);
    return false;
  }
};

module.exports = {
  validatePackage,
  addCartToCache,
  addToCurrentCartCache,
  updateCartCache,
  updateCartItemsCache,
  deleteCartItemCache,
  addCouponCodeCache,
  removeCouponCodeCache,
};
