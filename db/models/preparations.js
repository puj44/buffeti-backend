const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const preparationsSchema = new Schema({
    location: { type: String, required: true , index:true},
    menu_option: { type: String, required: true, index:true },

    slug: { type: String, required: true, index:true },
    item_name: { type: String, required: true },


},{timestamps:true});


const Preparations = mongoose.model('preparations', preparationsSchema);

module.exports = Preparations;