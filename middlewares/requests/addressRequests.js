const Joi = require("../validator/schemas");
const addressRequests = {
  add: {
    full_name: Joi.string().required().label("Name"),
    house_building_no: Joi.string()
      .min(1)
      .max(30)
      .required()
      .label("House/Building No."),
    address: Joi.string().min(3).max(100).required().label("Address Line"),
    area: Joi.string().min(1).max(70).required().label("Area"),
    city: Joi.string().max(50).required().label("City"),
    pincode: Joi.string().min(6).max(6).required().label("Pincode"),
    lattitude: Joi.string().label("Lattitude"),
    longitude: Joi.string().label("Longitude"),
  },
  edit: {
    full_name: Joi.string().empty(["", null]).label("Name"),
    house_building_no: Joi.string()
      .min(1)
      .max(30)
      .empty(["", null])
      .label("House/Building No."),
    address: Joi.string()
      .min(3)
      .max(100)
      .empty(["", null])
      .label("Address Line"),
    area: Joi.string().min(1).max(50).empty(["", null]).label("Area"),
    city: Joi.string().max(70).empty(["", null]).label("City"),
    pincode: Joi.string().min(6).max(6).empty(["", null]).label("pincode"),
    lattitude: Joi.string().label("Lattitude").empty(["", null]),
    longitude: Joi.string().label("Longitude").empty(["", null]),
  },
};

module.exports = { addressRequests };
