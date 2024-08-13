const moment = require("moment");
const {
  addCartToCache,
  addToCurrentCartCache,
  updateCartCache,
  updateCartItemsCache,
  deleteCartItemCache,
  addCouponCodeCache,
  removeCouponCodeCache,
} = require("../common/calculateCart");
const { Cart, CartItems } = require("../db/models/cart");
const CustomersAddresses = require("../db/models/customerAddresses");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { default: mongoose } = require("mongoose");
const { getCartDetails, validateDelivery } = require("../common/commonHelper");
const { ExtraServices } = require("../db/models/extraServices");
const CouponCodes = require("../db/models/couponCode");
const { get, set, remove } = require("../common/redisGetterSetter");
const ObjectId = require("mongodb").ObjectId;

//Add To Cart
const addtocart = async (req, res) => {
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    const { id } = req.user ?? {};
    const { location } = req.headers;
    const {
      menu_option,
      no_of_people,
      extra_services,
      items,
      package_name,
      replace, //if true delete Cart and cart_items
    } = req.body;

    const cart = await Cart.findOne({ customer_id: id }).lean();

    let cart_id = cart?._id;
    if (replace) {
      await CartItems.deleteMany({ cart_id: cart_id }, { session });
      await Cart.deleteOne({ _id: cart_id }, { session });
      cart_id = null;
    } else {
      if (cart) {
        if (cart.menu_option !== menu_option) {
          return sendRes(res, 400, {
            is_invalid: true,
            message: "Cart already exists!",
          });
        }
        if (
          cart.menu_option === "snack-boxes" ||
          cart.menu_option === "click2cater"
        ) {
          return sendRes(res, 400, {
            already_exists: true,
            message: "Items already exists!",
          });
        }
      }
    }

    const cartInsert =
      cart_id ??
      (await Cart.create(
        [
          {
            customer_id: id,
            menu_option: menu_option,
            location: location,
            extra_services: extra_services,
          },
        ],
        { session }
      ));
    let values = {};

    if (items) {
      Object.entries(items).forEach(([category, items]) => {
        return Object.keys(items).forEach((item) => {
          values[item] = items[item];
        });
      });
    }
    const cartItem = await CartItems.create(
      [
        {
          cart_id: cart_id ?? cartInsert[0]._id,
          no_of_people: no_of_people,
          package_name: package_name ?? null,
          items: values ?? {},
        },
      ],
      { session }
    );
    await session.commitTransaction();
    const cartItems = await CartItems.find({
      _id: new ObjectId(cartItem[0]._id),
    }).lean();

    let response = false;
    if (!cart_id) {
      response = await addCartToCache(
        {
          cart_id: cart_id ?? cartInsert[0]._id.toString(),
          cart_item_id: cartItem[0]._id.toString(),
          location: location,
          menu_option: menu_option,
          no_of_people: no_of_people,
          items: menu_option !== "mini-meals" ? cartItems[0].items : cartItems,
          package_name: package_name,
        },
        id
      );
    } else {
      response = await addToCurrentCartCache(
        {
          cart_id: cart_id.toString(),
          cart_item_id: cartItem[0]._id?.toString(),
          no_of_people: no_of_people,
          package_name: package_name,
        },
        id
      );
    }
    // if(!response){
    //   throw Error("Data not found");
    // }

    const cartDetails = await getCartDetails(id);
    return sendRes(res, 200, {
      message: "Cart item inserted successfully",
      data: {
        cartDetails: cartDetails ?? {},
      },
    });
  } catch (err) {
    //ROLLBACK
    await session.abortTransaction();
    console.log("ADD CART ERROR: ", err);
    sendError(res, err);
  }
};

//Get Cart
const getCart = async (req, res) => {
  try {
    const { id } = req.user ?? {};

    const cartObject = await get(`cart-${id}`, true);
    const cartDetails = await getCartDetails(id);
    return sendRes(res, 200, {
      data: {
        cart: cartObject ?? {},
        cartDetails: cartDetails ?? {},
      },
      message: "Cart fetched successfully",
    });
  } catch (err) {
    console.log("GET CART ERROR:", err);
    sendError(res, err);
  }
};

//Get Cart Information
const getCartInformation = async (req, res) => {
  try {
    const { id } = req.user ?? {};

    const cartDetails = await getCartDetails(id);
    return sendRes(res, 200, {
      data: {
        cartDetails: cartDetails ?? {},
      },
      message: "Cart Info fetched successfully",
    });
  } catch (err) {
    console.log("GET CART INFORMATION ERROR:", err);
    sendError(res, err);
  }
};

//Update Cart Information
const updateCart = async (req, res) => {
  try {
    const { id } = req.user ?? {};
    const cart_id = req.params.id;
    const {
      delivery_address_id,
      delivery_date,
      delivery_time,
      cooking_instruction,
      coupon_code,
      extra_services,
    } = req.body;

    const delivery_charges = 0; // TODO: get the distance between the outlet and customer address
    //TODO: delivery charges to be calculated
    if (!cart_id) {
      return sendRes(res, 404, {
        message: "Cart id not found",
      });
    }
    // const cartData = await
    const cart = await Cart.findOne({ _id: cart_id });

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }

    const deliveryAddressData = await CustomersAddresses.findOne({
      _id: delivery_address_id,
    });
    if (delivery_date && delivery_time) {
      const validation = validateDelivery(delivery_date, delivery_time);

      if (validation.isValid !== true) {
        return sendRes(res, 400, {
          message: validation.message,
        });
      }
    }
    const newCartData = {
      delivery_address_id: delivery_address_id ?? null,
      delivery_date: delivery_date ?? null,
      delivery_time: delivery_time ?? null,
      cooking_instruction: cooking_instruction
        ? cooking_instruction?.toString()?.trim()
        : null,
      delivery_charges: delivery_charges ?? 0,
      extra_services: extra_services ?? null,
      coupon_code: coupon_code ?? null,
    };

    // const cartObject = await calculateCart(id);
    const cartObject = await updateCartCache(id, newCartData);

    sendRes(res, 200, {
      data: {
        cart: cartObject ?? {},
      },
      message: "Cart updated successfully",
    });
    await set(`cart-${id}`, cartObject, true);
    await Cart.findOneAndUpdate(
      {
        _id: cart_id,
      },
      {
        ...newCartData,
      }
    );
  } catch (err) {
    console.log("UPDATE CART ERROR:", err);
    return sendError(res, err);
  }
};

//Update Cart Items Information
const updateCartItems = async (req, res) => {
  try {
    const { id } = req.user ?? {};
    const { location } = req.headers;
    const cart_item_id = req.params.id;
    const { no_of_people, items } = req.body;
    let updateData;

    if (!cart_item_id) {
      return sendRes(res, 404, {
        message: "Cart item id not found",
      });
    }
    const cartItem = await CartItems.findOne({ _id: cart_item_id }).lean();
    const cart = await Cart.findOne({
      _id: cartItem?.cart_id,
      customer_id: id,
    });

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }
    if (no_of_people) {
      updateData = { no_of_people: no_of_people };
    }
    const cachedCart = await get(`cart-${id}`, true);
    if (
      cart.menu_option === "click2cater" ||
      cart.menu_option === "snack-boxes"
    ) {
      if (items) {
        for (const it in items) {
          let item = JSON.parse(JSON.stringify(items[it]));
          item = {
            additional_qty: item.additional_qty ?? null,
            added_extra_items: item.added_extra_items ?? null,
            selected_preparation: item.selected_preparation ?? null,
          };
          updateData.items = {
            ...updateData.items,
            [it]: {
              ...(cachedCart?.cart_data?.items?.[it] ?? {}),
              ...item,
            },
          };
        }
      }
    }

    let redirect = false;
    if (
      cart.menu_option === "click2cater" ||
      cart.menu_option === "snack-boxes"
    ) {
      if (Object.keys(updateData.items ?? {}).length <= 0) {
        redirect = true;
      }
    }

    if (redirect) {
      await remove(`cart-${id}`);
      sendRes(res, 200, {
        redirect: redirect,
        data: {
          cartDetails: cartDetails ?? {},
        },
        message: "Cart updated successfully",
      });
    }
    const updateItemsObj = await updateCartItemsCache(
      id,
      { ...updateData, package_name: cartItem?.package_name },
      cachedCart
    );
    const calculateAndUpdate = await updateCartCache(id, {}, updateItemsObj);

    const cartDetails = await getCartDetails(id, calculateAndUpdate);

    sendRes(res, 200, {
      redirect: redirect,
      data: {
        cart: calculateAndUpdate ?? {},
        cartDetails: cartDetails ?? {},
      },
      message: "Cart updated successfully",
    });
    await set(`cart-${id}`, calculateAndUpdate, true);
    if (!redirect) {
      return await CartItems.findOneAndUpdate(
        { _id: cart_item_id },
        { ...updateData }
      );
    } else {
      await CartItems.deleteMany({ cart_id: cartItem.cart_id });
      return await Cart.deleteOne({ _id: cartItem.cart_id });
    }
  } catch (err) {
    console.log("UPDATE CART ITEMS ERROR:", err);
    return sendError(res, err);
  }
};

//Delete Cart
const deleteCart = async (req, res) => {
  try {
    const { id } = req.user ?? {};
    const cart_id = req.params.id;
    await remove(`cart-${id}`);
    if (!cart_id) {
      return sendRes(res, 404, {
        message: "Cart id not found",
      });
    }
    const cart = await Cart.findOne({ _id: cart_id });
    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }

    await CartItems.deleteMany({ cart_id: cart_id });
    await Cart.deleteOne({ _id: cart_id });
    return sendRes(res, 200, {
      message: "Cart deleted successfully",
    });
  } catch (err) {
    console.log("DELETE CART ERROR:", err);
    return sendError(res, err);
  }
};

//Delete Cart Items
const deleteCartItems = async (req, res) => {
  const cart_item_id = req.params.id;
  const { id } = req.user ?? {};
  if (!cart_item_id) {
    return sendRes(res, 404, {
      message: "Cart item ID not found",
    });
  }

  try {
    const cartItem = await CartItems.findOne({ _id: cart_item_id });

    if (!cartItem) {
      return sendRes(res, 404, {
        message: "Cart item not found",
      });
    }

    const cart = await Cart.findOne({ _id: cartItem.cart_id });

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }

    const cartItemCount = await CartItems.countDocuments({ cart_id: cart._id });

    const cartObject = await deleteCartItemCache(id, cartItem.package_name);
    const cartDetails = await getCartDetails(id, cartObject);
    sendRes(res, 200, {
      redirect: cartItemCount === 1,
      data: {
        cart: cartObject ?? {},
        cartDetails: cartDetails ?? {},
      },
      message: "Cart item deleted successfully",
    });
    await CartItems.deleteOne({ _id: cart_item_id });

    if (cartItemCount === 1) {
      await remove(`cart-${id}`);
      return await Cart.deleteOne({ _id: cart._id });
    }
    return;
  } catch (err) {
    console.log("DELETE CART ERROR:", err);
    return sendError(res, err);
  }
};

//Get Extra Services
const getExtraServices = async (req, res) => {
  try {
    const extraServices = await ExtraServices.find({});
    return sendRes(res, 200, {
      data: {
        extraServices: extraServices ?? {},
      },
      message: "Extra Services fetched successfully",
    });
  } catch (err) {
    console.log("GET EXTRA SERVICES ERROR:", err);
    sendError(res, err);
  }
};

//Add Coupon
const addCoupon = async (req, res) => {
  try {
    const cart_id = req.params.id;
    const { id } = req.user ?? {};
    const { code } = req.body;
    const cart = await Cart.findOne({ _id: cart_id });
    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }
    const couponData = await CouponCodes.findOne({
      coupon_code: code,
      is_active: true,
    });
    if (!couponData) {
      return sendRes(res, 400, {
        message: "Coupon code is invalid",
      });
    }

    const cartObject = await addCouponCodeCache(id, code);
    sendRes(res, 200, {
      data: {
        cart: cartObject,
      },
      message: "Coupon applied successfully!",
    });
    return await Cart.findOneAndUpdate(
      { _id: cart_id },
      {
        coupon_code: code,
      }
    );
  } catch (err) {
    console.log("ADD COUPON ERROR:", err);
    return sendError(res, err);
  }
};

//Remove Coupon
const removeCoupon = async (req, res) => {
  try {
    const cart_id = req.params.cartId;
    const { id } = req.user ?? {};

    const cartObject = await removeCouponCodeCache(id);
    sendRes(res, 200, {
      data: {
        cart: cartObject,
      },
      message: "Coupon removed successfully!",
    });
    return await Cart.findOneAndUpdate(
      { _id: cart_id },
      {
        coupon_code: null,
      }
    );
  } catch (err) {
    console.log("REMOVE COUPON ERROR:", err);
    return sendError(res, err);
  }
};

module.exports = {
  addtocart,
  getCart,
  getCartInformation,
  updateCart,
  updateCartItems,
  deleteCart,
  deleteCartItems,
  getExtraServices,
  addCoupon,
  removeCoupon,
};
