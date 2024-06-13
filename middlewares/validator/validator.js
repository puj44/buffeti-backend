const { validate, Joi } = require('express-validation');

function validator(requestBody, isQuery = false, isParam = false,){
    const paramName = isQuery ? "query" :  "body";
    const req = {
        [paramName]:Joi.object({
                ...requestBody
            }),
    }
    return validate(req,{},{});
}

module.exports = validator;