const Joi = require("../../middlewares/schemas");
const adminRequests = {
    signin:{
        username: Joi.string().required().label("Name"),
        password: Joi.numberString().len().required(),
    },
}

module.exports = {adminRequests}
