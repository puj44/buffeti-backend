const Joi = require("../validator/schemas");
const profileRequests = {
  verifyEmail: {
    email: Joi.string().email().required(),
    otp: Joi.numberString().len(4).required(),
  },
  sendOtpEmail: {
    email: Joi.string().email().required(),
  },
};

module.exports = { profileRequests };
