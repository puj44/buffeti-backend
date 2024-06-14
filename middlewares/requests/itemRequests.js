const Joi = require("../validator/schemas");
const itemRequests = {
    getItems:{
        category:Joi.string().empty(["",null]),
        search:Joi.string().empty(["",null])
    },
}

module.exports = {itemRequests}
