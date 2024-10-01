const Joi = require("../validator/schemas");
const authRequests = {
  signin: {
    mobile_number: Joi.numberString().len(10).required(),
    token:Joi.string().label("Token"),
  },
  verify: {
    mobile_number: Joi.numberString().len(10).required(),
    otp: Joi.numberString().len(4).required(),
  },
};

module.exports = { authRequests };
