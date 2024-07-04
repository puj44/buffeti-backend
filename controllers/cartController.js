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
    const { menu_option, no_of_people, extra_services, items, package_name } =
      req.body;
    let cartInsert;
    let values = {};

    if (items) {
      Object.entries(items).forEach(([category, items]) => {
        return Object.keys(items).forEach((item) => {
          values[item] = items[item];
        });
      });
    }

    const cart = await Cart.findOne({ customer_id: id }).then((d) => d);
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
        .catch((err) => console.log(err)));

    await CartItems.create(
      [
        {
          cart_id: cart_id ?? cartInsert[0]._id,
          no_of_people: no_of_people,
          package_name: package_name ?? null,
          items: items ?? {},
        },
      ],
      { session }
    )
      .then((d) => console.log(d))
      .catch((err) => console.log(err));

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

module.exports = { addtocart, getCart,getCartInformation };
