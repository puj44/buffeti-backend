const {Model} = require('objection');

class customers extends Model {
    static get tableName(){
        return 'customers'
    }
}

module.exports = customers;