const mongoose = require('mongoose');
const { Schema } = mongoose;


const locationsSchema = new Schema({
  location: { type: String, required: true, index:true },
});

const Locations = mongoose.model('locations', locationsSchema);

module.exports = Locations;