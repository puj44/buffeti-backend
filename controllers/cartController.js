const { ObjectId } = require("mongodb");
const { calculateCart } = require("../common/calculateCart");
const { Cart, CartItems } = require("../db/models/cart");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { default: mongoose } = require("mongoose");
const { getCartDetails } = require("../common/commonHelper");

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
    let values = {};

    if (items) {
      Object.entries(items).forEach(([category, items]) => {
        return Object.keys(items).forEach((item) => {
          values[item] = items[item];
        });
      });
    }
    console.log(values);

    const cart = await Cart.findOne({ customer_id: id })
      .lean()
      .then((d) => d);
    console.log(cart);
    const cart_id = cart?._id;

    if (cart) {
      if (cart.menu_option !== menu_option) {
        console.log(
          "existing menu option:",
          cart.menu_option,
          ", trying to add:",
          menu_option
        );
        return sendRes(res, 400, {
          is_invalid: true,
        });
      }
      if (
        cart.menu_option === "snack-boxes" ||
        cart.menu_option === "click2cater"
      ) {
        return sendRes(res, 400, {
          already_exists: true,
        });
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
      )
        .then(async (d) => d)
        .catch((err) => err));

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
    )
      .then((d) => d)
      .catch((err) => err);

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
    console.log(cartObject);
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
      delivery_address_id = delivery_address_id != null
        ? ObjectId(delivery_address_id)
        : null,
      delivery_date = delivery_date != null ? Date(delivery_address_id) : null,
      delivery_time = delivery_time != null ? String(delivery_time) : null,
      cooking_instruction = cooking_instruction != null
        ? String(delivery_instruction)
        : null,
      coupon_code = coupon_code != null ? String(coupon_code) : null,
      extra_services = extra_services.length <= 0
        ? String[extra_services]
        : null,
    } = req.body;
    const delivery_charges = 0; // TODO: get the distance between the outlet and customer address

    if (
      delivery_address_id &&
      delivery_date &&
      delivery_time &&
      cooking_instruction &&
      coupon_code &&
      extra_services &&
      cart_id
    ) {
      const cart = await Cart.findOne({ _id: cart_id }).then((d) => d);

      if (!cart) {
        return sendRes(res, 404, {
          message: "Cart not found",
        });
      }

      const deliveryAddressData = await customersAddresses
        .findOne({ _id: delivery_address_id })
        .then((d) => d)
        .catch((err) => err);

      if (
        ValidateDelivery(delivery_date, delivery_time) &&
        deliveryAddressData
      ) {
        const updatedCart = await Cart.findOneAndUpdate(
          {
            _id: cart_id,
          },
          {
            delivery_address_id: delivery_address_id,
            delivery_date: delivery_date,
            delivery_time: delivery_time,
            cooking_instruction: cooking_instruction,
            coupon_code: coupon_code,
            delivery_charges: delivery_charges,
            extra_services: extra_services,
          }
        )
          .then((d) => console.log(d))
          .catch((err) => console.log(err));

        if (updatedCart) {
          return sendRes(res, 200, {
            message: "Cart updated successfully",
          });
        }
      } else {
        return sendRes(res, 400, {
          message: "Delivery date should be on next day.",
        });
      }

      function ValidateDelivery(delivery_date, delivery_time) {
        const now = moment();
        const deliveryDateTime = moment(
          `${delivery_date} ${delivery_time}`,
          "YYYY-MM-DD HH:mm"
        );
        const isTomorrow = deliveryDateTime.isSame(now.add(1, "days"), "day");
        const isAfterNow = deliveryDateTime.isAfter(moment());
        return isTomorrow && isAfterNow;
      }
    }
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
    const { cart_id } = req.params;
    const {
      no_of_people = no_of_people != null ? Number(no_of_people) : null,
      items = items.length === 0 ? Map(items) : null,
      package_name = package_name != null ? String(package_name) : null,
    } = req.body;

    const cart = await Cart.findOne({ _id: cart_id }).then((d) => d);

    if (!cart) {
      return sendRes(res, 404, {
        message: "Cart not found",
      });
    }
    if (!no_of_people || items.length === 0) {
      return sendRes(res, 400, {
        message: "Invalid data! please try again",
      });
    }
    let updateData = { no_of_people: no_of_people };

    switch (cart.menu_option) {
      case "click2cater":
      case "snack-boxes":
        updateData.items = items;
        break;

      case "mini-meals":
        updateData.package_name = package_name;
        break;
    }

    const updatedCart = await CartItems.findOneAndUpdate(
      { cart_id: cart_id },
      updateData
    );

    if (!updatedCart) {
      return sendRes(res, 400, {
        message: "Error updating cart",
      });
    }

    res.sendRes(res, 200, {
      message: "Cart updated successfully",
    });
  } catch (err) {
    console.log("UPDATE CART ITEMS ERROR:", err);
    sendError(res, err);
  }
};

module.exports = {
  addtocart,
  getCart,
  getCartInformation,
  updateCart,
  updateCartItems,
};
