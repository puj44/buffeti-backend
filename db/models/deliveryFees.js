const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const deliveryFeesSchema = new Schema({
    location:{type:String, required:true},
    min:{type:Number, min:0, required:true},
    max: {
        type: Number,
        validate: {
          validator: function(value) {
            // `this` refers to the current document being validated
            return value >= this.min;
          },
          message: props => `Max distance (${props.value}) must be greater than Min distance (${props.instance.min}).`
        },
        default:undefined
    },
    fees:{type:Number, min:0, required:true}
},{timestamps:true});

const DeliveryFees = mongoose.model('delivery_fees', deliveryFeesSchema);

module.exports = DeliveryFees;