const { get, set } = require("./redisGetterSetter");
const { Cart, CartItems } = require("../db/models/cart");

const sendError = require("./sendError");
const sendRes = require("./sendResponse");
const { findItems, findMiniMeals } = require("./findItems");
const Packages = require("../db/models/packages");
const { calculateItems, validatePackage, calculatePackages } = require("./commonHelper");
const { ExtraServices } = require("../db/models/extraServices");
const CouponCodes = require("../db/models/couponCode");
const Items = require("../db/models/items");

const updateCartCache = async (customerId, newCartData, data = null) => {
  try{
    let cartData = data ?? await get(`cart-${customerId}`,true);
    cartData = {
      ...cartData,
      ...newCartData ?? {}
    };
    let billingDetails = cartData.billing_details ?? {};
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
    // let coupon_type = null;
    // let coupon_discount = null;
    let coupon_discount_value = billingDetails.coupon_discount_value ?? 0;
    // if(cartData?.coupon_code && cartData?.coupon_code !== null){
    //   const couponData = await CouponCodes.findOne({coupon_code:cartData?.coupon_code,is_active:true});
    //   coupon_type = couponData.discount_type;
    //   coupon_discount = couponData.discount_value
    //     let couponVal = 0;
    //     if(couponData.discount_type === "PCT"){
    //       couponVal =  (cartData.total_amount * couponData.discount_value)/ 100;
    //     }else{
    //       couponVal = couponData.discount_value;
    //     }
    //     coupon_discount_value= couponVal;
    billingDetails.total_amount = Number(billingDetails?.total_amount - coupon_discount_value);
    // }
    billingDetails.total_billed_amount = Number(billingDetails.total_amount + (billingDetails.total_amount * 5) / 100);
    billingDetails.extra_services_charges = extra_services_charges
    cartData.billing_details = billingDetails;
    return cartData;
  }catch(err){
    console.log("UPDATE CART CACHE:",err)
    return false;
  }
}

const updateCartItemsCache = async(customerId,newCartItems, data = null) =>{
  try{
    let cartData = data ?? await get(`cart-${customerId}`,true);
    if(cartData.menu_option !== "mini-meals"){
      cartData.cart_data.no_of_people = newCartItems.no_of_people;
      // cartData.cart_data.items = newCartItems.items;
      const packagesData = await Packages.findOne({ slug: cartData.cart_data.package_name, menu_option:cartData.menu_option }).lean();
      let isPackageValid = false;
      if(packagesData){
  
        isPackageValid = await validatePackage(
          newCartItems.items,
          packagesData
        );
      }
      const {itemsPricing,
        extraChargesArray,
        addOnChargesSum,
        addOnChargesQty,
        totalItemsAmount,
        calculatedItems, error} =  await calculateItems({location:cartData.location, menu_option:cartData.menu_option, no_of_people:cartData.cart_data.no_of_people,isPackageValid},newCartItems.items, packagesData) ;
      
        if(error){
          return false;
        }
        cartData.cart_data.items = calculatedItems;

        cartData.billing_details = {
          ...cartData.billing_details,
          item_pricing:itemsPricing,
          addon_charges: {
            addOnCharges:addOnChargesSum ?? 0,
            addOnChargesQty:addOnChargesQty ?? 0,
          },
          extra_charges: extraChargesArray,
          total_amount:totalItemsAmount,
          total_items_amount:totalItemsAmount
        }
    }else{
      cartData.cart_data[newCartItems.package_name] = {
        ...cartData.cart_data[newCartItems.package_name],
        no_of_people:newCartItems.no_of_people
      }
      const {itemsPricing, totalItemsAmount} = await calculatePackages(cartData.cart_data);
      cartData.billing_details = {
        ...cartData.billing_details,
        item_pricing:itemsPricing,
        total_items_amount:totalItemsAmount,
        total_amount:totalItemsAmount,
      }
    }

    return cartData;
 }catch(err){
    console.log("UPDATE CART ITEMS CACHE:",err)
    return false;
  }
}

const addToCurrentCartCache = async (data, customerId) =>{
  const {cart_id, cart_item_id, no_of_people, package_name} = data;
  try{

    let currentCartData = await get(`cart-${customerId}`,true);
    const newCartItem = [{
      _id:cart_item_id,
      no_of_people:no_of_people,
      package_name:package_name,
    }];
    const cartItemValues = await findMiniMeals(newCartItem);
    const currentValue = cartItemValues[package_name];

    if(cartItemValues && currentCartData){
      currentCartData.cart_data = {
        ...currentCartData.cart_data,
        [package_name]:currentValue
      }
      const totalPrice = Number(currentValue.price * currentValue.no_of_people);

      let billingDetails = currentCartData?.billing_details;
      billingDetails.item_pricing.push({
        item_name: currentValue?.item_name,
        amount: totalPrice,
        qty: Number(currentValue.no_of_people),
      });
  
      billingDetails.total_amount = Number(billingDetails.total_amount + totalPrice)
      billingDetails.total_billed_amount = Number(billingDetails.total_billed_amount + totalPrice);
      currentCartData.billing_details = billingDetails;
      await set(`cart-${customerId}`,currentCartData,true);
    }
  }catch(err){
    console.log("ADD MORE TO CART CACHE:",err)
    return false;
  }
}

const addCartToCache = async(data, customerId) =>{
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
  try{

    if(menu_option !== "mini-meals"){
  
        for(const item in items){
          const currentItemValues = JSON.parse(JSON.stringify(items[item] ?? false));
          const dbItem = JSON.parse(JSON.stringify(await Items.findOne({ slug: item }).lean() ?? {}));
          if(Object.keys(dbItem ?? {}).length < 0){
            return false;
          }
          delete dbItem._id;
          delete dbItem.__v;
          delete dbItem.createdAt;
          delete dbItem.updatedAt;
          cartItemValues[item] = {
            ...dbItem,
            additional_qty:currentItemValues.additional_qty ?? 0,
            added_extra_items:currentItemValues.added_extra_items ?? {},
            selected_preparation:currentItemValues.selected_preparation ?? null,
          }
        }
      const packagesData = await Packages.findOne({ slug: package_name, menu_option:menu_option }).lean();
      if(packagesData){
  
        isPackageValid = await validatePackage(
          cartItemValues,
          packagesData
        );
      }
      const {itemsPricing,
        extraChargesArray,
        addOnChargesSum,
        addOnChargesQty,
        totalItemsAmount,
        calculatedItems, error} =  await calculateItems({location, menu_option, no_of_people,isPackageValid},cartItemValues, packagesData) 
        if(error){
          return false;
        }
        cartItemValues = {
          cart_item_id: cart_item_id,
          package_name: package_name,
          no_of_people: no_of_people,
          items: calculatedItems,
        }
        billingDetails = {
          item_pricing:itemsPricing,
          addon_charges: {
            addOnCharges:addOnChargesSum ?? 0,
            addOnChargesQty:addOnChargesQty ?? 0,
          },
          extra_charges: extraChargesArray,
          total_amount:totalItemsAmount,
          total_items_amount:totalItemsAmount
        }
    }else{
      cartItemValues = await findMiniMeals(items);
      const {itemsPricing, totalItemsAmount} = await calculatePackages(cartItemValues);
      billingDetails = {
        item_pricing:itemsPricing,
        total_items_amount:totalItemsAmount,
        total_amount:totalItemsAmount,
      }
    }
    billingDetails.total_billed_amount = Number(billingDetails.total_amount + (billingDetails.total_amount * 5) / 100);
    globalData = {
      cart_id:cart_id,
      location:location,
      menu_option:menu_option,
      cart_data:cartItemValues,
      billing_details: billingDetails,
    }
    await set(`cart-${customerId}`,globalData,true);
    return true;
  }catch(err){
    console.log("ADD TO CART CACHE:",err);
    return false;
  }
  
}



//Calculates the pricing of whole Cart
async function calculateCart(id) {
  let cart, cartItems;
  //GET CART DATA
  cart = await Cart.findOne({ customer_id: id });
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
    delivery_charges
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
  let coupon_type = null;
  let coupon_discount = null;
  let coupon_discount_value = null;
  if(coupon_code && coupon_code !== null){
    const couponData = await CouponCodes.findOne({coupon_code:coupon_code,is_active:true});
    coupon_type = couponData.discount_type;
    coupon_discount = couponData.discount_value
      let couponVal = 0;
      if(couponData.discount_type === "PCT"){
        couponVal =  (total_amount * couponData.discount_value)/ 100;
      }else{
        couponVal = couponData.discount_value;
      }
      coupon_discount_value= couponVal;
      total_amount = Number(total_amount - couponVal);
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
    coupon_type:coupon_type,
    coupon_discount:coupon_discount,
    billing_details: {
      extra_services_charges: extra_services_charges,
      item_pricing: items_pricing,
      addon_charges: {
        addOnCharges,
        addOnChargesQty,
      },
      extra_charges: extra_charges,
      
      coupon_discount_value:coupon_discount_value,
      total_amount: total_amount,
      total_billed_amount: total_billed_amount,
    },
  };

  return globalObj;
}

module.exports = {
  validatePackage,
  calculateCart,
  addCartToCache,
  addToCurrentCartCache,
  updateCartCache,
  updateCartItemsCache
};
