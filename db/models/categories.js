const mongoose = require('mongoose');
const { Schema } = mongoose;

// const subCategorySchema = new Schema({
//   type: Map,
//   of: String,
// },{_id:false});

const categorySchema = new Schema({
  name: { type: String, required: true },
  sub_categories: {
    type: Map,
    of: String,
    default: {},
  },
},{_id:false});

const categoriesSchema = new Schema({
  location: { type: String, required: true, index:true },
  menu_option: { type: String, required: true, index:true },
  categories: {
    type: Map,
    of: categorySchema,
  },
});

const categories = mongoose.model('categories', categoriesSchema);

module.exports = categories;