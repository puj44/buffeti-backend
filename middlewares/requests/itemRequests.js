const Joi = require("../validator/schemas");
const itemRequests = {
    getItems:{
        search:Joi.string().empty(["",null]),
        is_jain:Joi.string().valid("true","false").empty(["",null])
    },
}

module.exports = {itemRequests}
