const Joi = require("../validator/schemas");
const customerRequests = {
    signup:{
        name: Joi.string().required().label("Name"),
        mobile_number: Joi.numberString().len(10).required(),
        email: Joi.string()
    },
}

module.exports = {customerRequests}
