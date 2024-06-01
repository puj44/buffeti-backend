const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const customersSchema = new Schema({
    name: {type: String},
    mobile_number: {type: Number, unique: true, required: true},
    email:{type: String, match: /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/, default:null}, 
    is_email_verified:{type:Boolean, default:false}
});

class customers extends Model {}

module.exports = mongoose.model(customers, customersSchema, 'customers');