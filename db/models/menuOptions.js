const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const menuOptionsSchema = new Schema({
    name:{type:String, required:true},
    slug:{type:String, required:true}
});

class menuOptions extends Model {}

module.exports = mongoose.model(menuOptions, menuOptionsSchema, 'menuOptions');