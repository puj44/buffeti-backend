//Twilio
const accountID = process.env.ACCOUNT_ID;
const authToken = process.env.AUTH_TOKEN;
const serviceSID = process.env.SERVICE_SID;
const client = require('twilio')(accountID, authToken, {
    lazyLoading: false
});
module.exports = {client,serviceSID};