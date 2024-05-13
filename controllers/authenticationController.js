
//Models
const customersModel = require('../db/models/customers')

//Twilio
const accountID = process.env.ACCOUNT_ID;
const authToken = process.env.AUTH_TOKEN;
const serviceSID = process.env.SERVICE_SID;
const client = require('twilio')(accountID, authToken, {
    lazyLoading: false
});


// let date = [{"time":"2024-05-12T07:12:28.000Z"},{"time":"2024-05-12T07:13:30.000Z"}]
// const len = date.length;
// const d = JSON.parse(date);
// console.log(len,d);
// let result =[{"time": "2024-05-12T07:12:28.000Z"},{"time": "2024-05-12T07:13:30.000Z"},{"time": "2024-05-12T07:19:59.000Z"}]
// let attempt_array_length =result.length;
// let lastAttempttime = result[attempt_array_length];
// function getValueByKey(object, row){
//     return object[row];
// }
// console.log(getValueByKey(result[attempt_array_length],"time"));

const sendOtp =  async (req, res) => {

    const phoneNumber = req.body.phoneNumber;

    let lastAttempttime;
    let attempt_array_length;
    let result;

    try{

        await client.verify
            .v2
            .services(serviceSID)
            .verifications.create({
                to: `+91${phoneNumber}`,
                channel: 'sms',
            })
            .then(verifications => verifications);
            attempt_array_length = result.sendCodeAttempts.length();
            lastAttempttime = new Date(verifications.sendCodeAttempts[attempt_array_length].time).getTime();
            res.status(200).send();
    }catch(error){
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
}

const verifyOtp = async (req, res) =>{

    try{

        const phoneNumber = req.body.phoneNumber;
        const otp = req.body.otp;

        //getting phone number from database
        const customer = await customersModel.query()
            .select('phoneNumber')
            .where('phoneNumber',phoneNumber);
        const customerJson = JSON.parse(customer);

        //inserting phoneNumber if not exist in database.
        if(customerJson.phoneNumber !== phoneNumber){
            const insertCustomer = await customersModel.query()
                .insert({
                    phoneNumber : phoneNumber
                });
        }

        //verify OTP
        await client.verify
            .v2
            .services(serviceSID)
            .verificationChecks.create({
                to: `+91${phoneNumber}`,
                code: otp,
            })
            .then(verificationChecks => res.status(200).send(verificationChecks));
    }catch(error){
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
}

// {
//     "status": "approved",
//     "payee": null,
//     "date_updated": "2024-05-11T17:09:45Z",
//     "account_sid": "AC0bc783cf82cd30ef47dc570dc2c31797",
//     "to": "+919586808400",
//     "amount": null,
//     "valid": true,
//     "sid": "VE8da43d90bab18a112cfda58cf622d71f",
//     "date_created": "2024-05-11T17:01:22Z",
//     "service_sid": "VA9842ba91aa6b968449be24e6836aa99d",
//     "channel": "sms"
//   }

const authenticate =async (req, res) =>{


}

module.exports = {
    sendOtp,
    verifyOtp,
}

// {
//     "sid": "VE44208fe08854ae1a074f82c760916859",
//     "serviceSid": "VA717572fec3e1b9d64e74bdb5e72ce33e",
//     "accountSid": "AC0bc783cf82cd30ef47dc570dc2c31797",
//     "to": "+919586808400",
//     "channel": "sms",
//     "status": "pending",
//     "valid": false,
//     "lookup": {
//         "carrier": null
//     },
//     "amount": null,
//     "payee": null,
//     "sendCodeAttempts": [
//         {
//             "attempt_sid": "VL0d74e2cb879be0a6dfecd486933ee0c0",
//             "channel": "sms",
//             "time": "2024-05-12T07:12:28.000Z"
//         },
//         {
//             "attempt_sid": "VL74716acb507b1a28d6acb6b26d50ac27",
//             "channel": "sms",
//             "time": "2024-05-12T07:13:30.000Z"
//         },
//         {
//             "attempt_sid": "VL6d6f13371fee4a30802bbbbe71524c5d",
//             "channel": "sms",
//             "time": "2024-05-12T07:19:59.000Z"
//         }
//     ],
//     "dateCreated": "2024-05-12T07:12:28.000Z",
//     "dateUpdated": "2024-05-12T07:19:59.000Z",
//     "url": "https://verify.twilio.com/v2/Services/VA717572fec3e1b9d64e74bdb5e72ce33e/Verifications/VE44208fe08854ae1a074f82c760916859"
// }