const mongoose = require('mongoose');
const { Schema, Model} = mongoose;


const itemsSchema = new Schema({
    location: { type: String, required: true , index:true},
    menu_option: { type: String, required: true, index:true },

    slug: { type: String, required: true,index:true  },
    item_name: { type: String, required: true },
    serving_per_pax: { type: Number, required: true },
    unit: { type: String, required: true },
    rate_per_serving: { type: Number, required: true },
    buffeti_rate_per_serving:{type: Number, required: false, default:null},

    category: { type: Object, default: {} },
    sub_category: { type: Object, default: null },
    
    is_additional_serving: { type: Boolean, required: false },

    additional_serving: { type: Number, required: false, default:null },
    additional_serving_unit: { type: String, required: false, default:null },
    additional_serving_rate: { type: Number, required: false, default:null },
    food_cost:{type:Number, required: false, default:null},
    extra_items: { type: Map, of: String, default: null },
    preparations: { type: Object, default: null },

    is_jain:{type:Boolean, default:false},

    images: { type: [String], default: [] },
},{timestamps:true});


const ItemsModel = mongoose.model('items', itemsSchema);

module.exports = ItemsModel;