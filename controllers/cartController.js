const { ObjectId } = require("mongodb");
const moment = require("moment");
const { calculateCart } = require("../common/calculateCart");
const { Cart, CartItems } = require("../db/models/cart");
const { CustomersAddresses } = require("../db/models/customerAddresses");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { default: mongoose } = require("mongoose");
const { getCartDetails, validateDelivery } = require("../common/commonHelper");
const { ExtraServices } = require("../db/models/extraServices");
const { CouponCode } = require("../db/models/couponCode");

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
      replace, //if ture dalete Cart and cart_items
    } = req.body;
    let cartInsert;

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

    cartInsert =
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
    await CartItems.create(
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
    return sendRes(res, 200, {
      message: "Cart item inserted successfully",
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

    const cartObject = await calculateCart(id);
    return sendRes(res, 200, {
      data: {
        cart: cartObject ?? {},
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

    const cart = await Cart.findOne({ _id: cart_id }).lean();

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }

    const deliveryAddressData = await CustomersAddresses.findOne({
      _id: delivery_address_id,
    });

    const validation = validateDelivery(delivery_date, delivery_time);

    if (validation.isValid !== true) {
      return sendRes(res, 400, {
        message: validation.message,
      });
    }
    await Cart.findOneAndUpdate(
      {
        _id: cart_id,
      },
      {
        delivery_address_id: delivery_address_id ?? null,
        delivery_date: delivery_date ?? null,
        delivery_time: delivery_time ?? null,
        cooking_instruction: cooking_instruction ?? null,
        delivery_charges: delivery_charges ?? 0,
        extra_services: extra_services ?? null,
      }
    );
    return sendRes(res, 200, {
      message: "Cart updated successfully!",
    });
  } catch (err) {
    console.log("UPDATE CART ERROR:", err);
    sendError(res, err);
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
    const cartItem = await CartItems.findOne({ _id: cart_item_id });
    const cart = await Cart.findOne({ _id: cartItem.cart_id });

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }
    if (no_of_people) {
      updateData = { no_of_people: no_of_people };
    }

    if (
      cart.menu_option === "click2cater" ||
      cart.menu_option === "snack-boxes"
    ) {
      if (items) {
        updateData.items = items;
      }
    }

    await CartItems.findOneAndUpdate({ _id: cart_item_id }, updateData);
    const cartObject = await calculateCart(id);

    return sendRes(res, 200, {
      data: {
        cart: cartObject ?? {},
      },
      message: "Cart updated successfully",
    });
  } catch (err) {
    console.log("UPDATE CART ITEMS ERROR:", err);
    sendError(res, err);
  }
};

//Delete Cart
const deleteCart = async (req, res) => {
  try {
    const { id } = req.user ?? {};
    const cart_id = req.params.id;

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
    sendError(res, err);
  }
};

//Delete Cart Items
const deleteCartItems = async (req, res) => {
  const cart_item_id = req.params.id;

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

    await CartItems.deleteOne({ _id: cart_item_id });

    if (cartItemCount === 1) {
      await Cart.deleteOne({ _id: cart._id });
    }

    return sendRes(res, 200, {
      message: "Cart item deleted successfully",
    });
  } catch (err) {
    console.log("DELETE CART ERROR:", err);
    sendError(res, err);
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
  const cart_id = req.params.id;
  const { coupon_code } = req.body;
  if (!cart_id || !coupon_code) {
    return sendRes(res, 404, {
      message: "Cart ID and coupon code are required",
    });
  }

  try {
    const coupon = await CouponCode.findOne({ coupon_code: coupon_code });

    if (!coupon) {
      return sendRes(res, 404, {
        message: "Coupon code not found",
      });
    }

    if (coupon.status !== "active") {
      return sendRes(res, 404, {
        message: "Coupon code is not active",
      });
    }

    const cart = await Cart.findOne({ _id: cart_id }).lean();

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }

    cart.coupon_code = coupon_code;
    await cart.save();

    const cartObject = await calculateCart(id);

    return sendRes(res, 200, {
      data: {
        cart: cartObject ?? {},
      },
      message: "Coupon code added to cart successfully",
    });
  } catch (err) {
    console.log("ADD COUPON ERROR:", err);
    sendError(res, err);
  }
};

//Remove Coupon
const removeCoupon = async (req, res) => {
  try {
  } catch (err) {
    console.log("REMOVE COUPON ERROR:", err);
    sendError(res, err);
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

const addCouponCodeToCart = async (req, res) => {
  const { cart_id } = req.params;
  const { coupon_code } = req.body;

  if (!cart_id || !coupon_code) {
    return res
      .status(400)
      .json({ message: "Cart ID and coupon code are required" });
  }

  try {
    const coupon = await CouponCode.findOne({ code: coupon_code });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found" });
    }

    if (coupon.status !== "active") {
      return res.status(400).json({ message: "Coupon code is not active" });
    }

    const cart = await Cart.findById(cart_id);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.coupon_code = coupon_code;
    await cart.save();

    return res
      .status(200)
      .json({ message: "Coupon code added to cart successfully", cart });
  } catch (error) {
    console.error("Error adding coupon code to cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Remove Coupon Code from Cart
const removeCouponCodeFromCart = async (req, res) => {
  const { cart_id } = req.params;

  if (!cart_id) {
    return res.status(400).json({ message: "Cart ID is required" });
  }

  try {
    const cart = await Cart.findById(cart_id);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.coupon_code = null;
    await cart.save();

    return res
      .status(200)
      .json({ message: "Coupon code removed from cart successfully", cart });
  } catch (error) {
    console.error("Error removing coupon code from cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
