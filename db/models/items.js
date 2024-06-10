const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

// const itemSchema = new Schema({
//     slug: { type: String, required: true },
//     item_name: { type: String, required: true },
//     serving_per_pax: { type: Number, required: true },
//     unit: { type: String, required: true },
//     rate_per_serving: { type: Number, required: false },

//     category: { type: String, default: "" },
//     sub_category: { type: String, required: false, default:null },
    
//     is_additional_serving: { type: Boolean, required: false },

//     additional_serving: { type: Number, required: false, default:null },
//     additional_serving_unit: { type: String, required: false, default:null },
//     additional_serving_rate: { type: Number, required: false, default:null },
//     extra_items: { type: Map, of: String, default: {} },
//     preparations: { type: Map, of: String, default: {} },

//     is_jain:{type:Boolean, default:false},
//     jain_preparations: { type: Map, of: String, default: {} },

//     images: { type: [String], default: [] },
//   },{_id:false,timestamps:true});

//   const extraItemsSchema = new Schema({
//     slug: { type: String, required: true },
//     item_name: { type: String, required: true },
//     serving_per_pax: { type: Number, required: true },
//     unit: { type: String, required: true },
//     rate_per_serving: { type: Number, required: false },

//     is_jain:{type:Boolean, default:false},

//     images: { type: [String], default: [] },
//   },{_id:false,timestamps:true});

//   const preparationsSchema = new Schema({
//     slug: { type: String, required: true },
//     item_name: { type: String, required: true },
//     serving_per_pax: { type: Number, required: true },
//     unit: { type: String, required: true },
//     rate_per_serving: { type: Number, required: false },

//     is_jain:{type:Boolean, default:false},

//     images: { type: [String], default: [] },
//   },{_id:false,timestamps:true});

// const categorySchema = new Schema({
//     category_name:{type:String, required:true},
//     items:{
//         type:Map, 
//         of:itemSchema
//     }
// },{_id:false});

// const itemsSchema = new Schema({
//     location: { type: String, required: true },
//     menu_option: { type: String, required: true },
//     menu_items: {
//         type: Map,
//         of:categorySchema
//     },
//     extra_items:{
//         type:Map,
//         of:extraItemsSchema
//     },
//     preparations:{
//         type:Map,
//         of:preparationsSchema
//     }
// },{timestamps:true});


const itemsSchema = new Schema({
    location: { type: String, required: true , index:true},
    menu_option: { type: String, required: true, index:true },

    slug: { type: String, required: true,index:true  },
    item_name: { type: String, required: true },
    serving_per_pax: { type: Number, required: true },
    unit: { type: String, required: true },
    rate_per_serving: { type: Number, required: false },

    category: { type: Object, default: {} },
    sub_category: { type: Object, default: {} },
    
    is_additional_serving: { type: Boolean, required: false },

    additional_serving: { type: Number, required: false, default:null },
    additional_serving_unit: { type: String, required: false, default:null },
    additional_serving_rate: { type: Number, required: false, default:null },
    extra_items: { type: Map, of: String, default: {} },
    preparations: { type: Object, default: {} },

    is_jain:{type:Boolean, default:false},
    jain_preparations: { type: Map, of: String, default: {} },

    images: { type: [String], default: [] },
},{timestamps:true});


const ItemsModel = mongoose.model('items', itemsSchema);

module.exports = ItemsModel;