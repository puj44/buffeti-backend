const Joi = require("../validator/schemas");
const packageRequests = {
  getPackages: {
    min: Joi.number().min(0).empty(["", null]),
    max: Joi.number().greater(Joi.ref("min")).empty(["", null]),
    category: Joi.string().empty(["", null]),
    no_of_people: Joi.string().empty(["", null]),
  },
};

module.exports = { packageRequests };
