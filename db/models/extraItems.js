const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const extraItemsSchema = new Schema({
    location: { type: String, required: true , index:true},
    menu_option: { type: String, required: true, index:true },

    slug: { type: String, required: true, index:true },
    item_name: { type: String, required: true },
    serving_per_pax: { type: Number, required: true },
    unit: { type: String, required: true },
    rate_per_serving: { type: Number, required: false },


    is_jain:{type:Boolean, default:false},
},{timestamps:true});


const ExtraItems = mongoose.model('extra_items', extraItemsSchema);

module.exports = ExtraItems;