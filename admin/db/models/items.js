const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

// Define sub-schema for sub-categories
const subCategorySchema = new mongoose.Schema({
    name: String,
    subCategories: {
        type: Map,
        of: String
    }
});

// Define schema for category
const categorySchema = new mongoose.Schema({
    name: String,
    subCategories: {
        type: subCategorySchema,
        default: {}
    }
});

// Define schema for catering service
const cateringServiceSchema = new mongoose.Schema({
    name: String,
    categories: {
        type: Map,
        of: categorySchema
    }
});

// Define schema for location
const locationSchema = new mongoose.Schema({
    name: String,
    cateringServices: {
        type: Map,
        of: cateringServiceSchema
    }
});

const LocationModel = mongoose.model('Location', locationSchema);

module.exports = LocationModel;