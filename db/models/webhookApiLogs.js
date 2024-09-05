const mongoose = require('mongoose');
const { Schema, Model} = mongoose;

const webhookApiLogsSchema = new Schema({
    order_number: { type: String, ref: "order" },
    request_body:{type:String}
},{timestamps:true});

const webhookApiLogs = mongoose.model("webhook_api_logs", webhookApiLogsSchema);
module.exports = webhookApiLogs ;