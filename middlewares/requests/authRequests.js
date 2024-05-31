const Joi = require("../schemas");
const authRequests = {
    signin:{
        mobile_number: Joi.numberString().len(10).required(),
    },
    verify:{
        mobile_number: Joi.numberString().len(10).required(),
        otp:Joi.numberString().len(6).required()
    },
}

module.exports = {authRequests}