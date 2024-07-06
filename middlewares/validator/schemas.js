const { Joi  } = require('express-validation');

const customJoi = Joi.extend((joi) => ({
    type: 'numberString',
    base: joi.string(),
    messages: {
      'numberString.len': 'The {{#label}} must be exactly {{#length}} digits.',
      'numberString.base': 'The value must be a string of digits.',
    },
    rules: {
      len: {
        method(length) {
          return this.$_addRule({ name: 'len', args: { length } });
        },
        validate(value, helpers, { length }) {
          if (value.length !== length) {
            return helpers.error('numberString.len', { length });
          }
          if (!/^\d+$/.test(value)) {
            return helpers.error('numberString.base');
          }
          return value;
        }
      }
    }
  }),
);
  

  module.exports = customJoi