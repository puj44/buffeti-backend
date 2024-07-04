const { ObjectId } = require("mongodb");
const { Cart, CartItems } = require("../db/models/cart");

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

module.exports = { updateCart, updateCartItems };
