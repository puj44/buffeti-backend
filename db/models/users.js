const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const usersSchema = new Schema({
    email:{type: String, match: /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/, required:true}, 
    password:{type:String, required:true}
});

class users extends Model {}

module.exports = mongoose.model(users, usersSchema, 'users');