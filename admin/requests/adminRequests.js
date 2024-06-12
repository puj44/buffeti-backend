const Joi = require("../../middlewares/schemas");
const adminRequests = {
    signin:{
        email: Joi.string().required().label("Email"),
        password: Joi.string().required().label("Password"),
    },
}

module.exports = {adminRequests}
