const Joi = require("../validator/schemas");
const profileRequests = {
  verifyEmail: {
    otp: Joi.numberString().len(4).required(),
  },
};

module.exports = { profileRequests };
