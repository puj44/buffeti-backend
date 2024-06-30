const { validatePackage, calculateItems } = require("../common/calculateCart");
const Items = require("../db/models/items");
const MiniMeals = require("../db/models/miniMeals");
const Packages = require("../db/models/packages");
const { Cart, CartItems } = require("../db/models/cart");
const sendError = require("../common/sendError");
const sendRes = require("../common/sendResponse");
const { findItems } = require("../common/findItems");

const addtocart = async (req, res) => {
  const { id } = req.user ?? {};
  const { location } = req.headers;
  const { menu_option, no_of_people, items, extra_services } = req.body;
  const package_name =
    menu_option === ("click2cater" || "mini-meals")
      ? req.body.package_name
      : null;
  let cartInsert, cartItemsInsert, itemsData;

  try {
    let values = {};
    Object.entries(items).forEach(([category, items]) => {
      return Object.keys(items).forEach((item) => {
        values[item] = items[item];
      });
    });

    const cart = await Cart.findOne({ customer_id: id }).then((d) => d);

    if (cart) {
      if (cart.menu_option !== menu_option) {
        return sendRes(res, 400, {
          is_invalid: true,
        });
      }
      return sendRes(res, 400, {
        message: "Cart already exists",
      });
    } else {
      cartInsert = await Cart.create({
        customer_id: id,
        menu_option: menu_option,
        location: location,
        extra_services: extra_services,
      })
        .then((data) => data)
        .catch((err) => err);

      if (cartInsert) {
        cartItemsInsert = await CartItems.create({
          cart_id: cartInsert._id,
          no_of_people: no_of_people,
          package_name: package_name,
          items: items,
        })
          .then((data) => data)
          .catch((err) => err);

        if (cartItemsInsert) {
          return sendRes(res, 200, {
            message: "Cart item inserted successfully",
          });
        } else {
          sendRes(res, 500, {
            message: "Couldn't inserted cart item",
          });
        }
      } else {
        sendRes(res, 500, {
          message: "Couldn't inserted cart",
        });
      }
    }
  } catch (err) {
    sendError(res, err);
  }
};

//Get Cart
const getCart = async (req, res) => {
  try {
    const { id } = req.user ?? {};
    let cart, cartItems;

    cart = await Cart.findOne({ customer_id: id }).then((d) => d);

    if (!cart) {
      return sendError(res, "Oops! There is nothing here!", 404);
    }

    cartItems = await CartItems.findOne({ cart_id: cart?._id }).then((d) => d);

    if (!cartItems) {
      return sendError(res, "Oops! There is nothing here!", 404);
    }

    const { menu_option, location, extra_services } = cart;
    const { no_of_people, package_name, items } = cartItems;

    let packagesData,
      miniMealsData,
      itemsData,
      isValidPackage = true,
      total_items_amount,
      total_amount,
      packagePrice,
      itemObj;

    const data = {
      itemsData: itemsData,
      items: items,
      menu_option: menu_option,
      no_of_people: no_of_people,
      isValidPackage: isValidPackage,
      location: location,
    };

    switch (menu_option) {
      case "click2cater":
        {
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
            });
          } else {
            return sendRes(res, 500, {
              message: "Couldn't find data",
            });
          }
          if (isValidPackage) {
            total_amount += total_items_amount + packagePrice;
          }
          return sendRes(res, 200, {
            total_amount: total_amount,
          });
        }
        break;
      case "snack-boxes":
        {
          itemsData = await findItems(items, menu_option);
          if (itemsData) {
            itemObj = await calculateItems(data);
          }
        }
        break;
      case "mini-meals":
        {
          miniMealsData = await MiniMeals.findOne({ slug: package_name }).then(
            (d) => d
          );
          itemsData = await findItems(items, menu_option, package_name);
        }
        break;
    }
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { addtocart, getCart };
