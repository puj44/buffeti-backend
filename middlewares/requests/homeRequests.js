const Joi = require("../validator/schemas");
const homeRequests = {
    getPackages:{
        min:Joi.number().min(0),
        max:Joi.number().greater(Joi.ref("min")),
        category:Joi.string()
    },
}

module.exports = {homeRequests}
