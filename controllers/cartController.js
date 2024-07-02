const { calculateCart } = require("../common/calculateCart");
const { Cart, CartItems } = require("../db/models/cart");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { default: mongoose } = require("mongoose");

//Add To Cart
const addtocart = async (req, res) => {
 
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    const { id } = req.user ?? {};
    const { location } = req.headers;
    const { menu_option, no_of_people, items, extra_services } = req.body;
    const package_name =
      menu_option === ("click2cater" || "mini-meals")
        ? req.body.package_name
        : null;
    let cartInsert;
    let values = {};
    Object.entries(items).forEach(([category, items]) => {
      return Object.keys(items).forEach((item) => {
        values[item] = items[item];
      });
    });

    const cart = await Cart.findOne({ customer_id: id }).then((d) => d);
    const cart_id = cart?._id;

    if (cart) {
      if (cart.menu_option !== menu_option) {
        return sendRes(res, 400, {
          is_invalid: true,
        });
      }
    }

    cartInsert =
      cart_id ??
      await Cart.create({
        customer_id: id,
        menu_option: menu_option,
        location: location,
        extra_services: extra_services,
      },{session})

      await CartItems.create({
        cart_id: cartInsert._id,
        no_of_people: no_of_people,
        package_name: package_name,
        items: items ?? {},
      },{session})
      await session.commitTransaction();
      return sendRes(res, 200, {
        message: "Cart item inserted successfully",
      });
  } catch (err) {
    //ROLLBACK
    await session.abortTransaction();
    console.log("ADD CART ERROR: ",err);
    sendError(res, err);
  }
};

//Get Cart
const getCart = async (req, res) => {
  try {
    const { id } = req.user ?? {};

    const cartObject = calculateCart(id);
    return sendRes(res, 200, {
      data:{
        cart:cartObject
      },
      message: "Cart fetched successfully",
    });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { addtocart, getCart };
