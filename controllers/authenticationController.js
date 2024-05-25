
//Models
const customersModel = require('../db/models/customers')

const {client,serviceSID} = require('./../config/twilio');
const mongoClient = require('../config/MongoClient');
const sendSMS = require("./../common/sendOtp");
const sendRes = require("../controllers/sendResponse");

const signin =  async (req, res) => {

    const mobile_number = req.body.mobile_number;


    try{
        //CALL sendOtp function
        const response = sendSMS(mobile_number);
        sendRes(res,200,
            {
                message:"Otp Sent successfully!",
                data:response
            }
        );
        //SEND RESPONSE AND PAYLOAD(IF EXISTS) ACCORDING TO RESPONSE OBJECT RETURNED



        
        // await client.verify.v2.services
        // .create({friendlyName: 'My First Verify Service'})
        // .then(service => console.log(service.sid));
        //  const result =await client.verify
        //     .v2
        //     .services(serviceSID)
        //     .verifications.create({
        //         to: `+91${phoneNumber}`,
        //         channel: 'sms',
        //     })
        //     .then(verifications => verifications);
        //     // attempt_array_length = result?.sendCodeAttempts?.length();
        //     // lastAttempttime = new Date(verifications.sendCodeAttempts?.[attempt_array_length].time).getTime();
        //     res.status(200).send();
    }catch(error){
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
}

const verifyOtp = async (req, res) =>{

    try{

        // const phoneNumber = req.body.phoneNumber;
        // const otp = req.body.otp;

        // //getting phone number from database
        // const customer = await customersModel.query()
        //     .select('phoneNumber')
        //     .where('phoneNumber',phoneNumber);
        // const customerJson = JSON.parse(customer);

        // //inserting phoneNumber if not exist in database.
        // if(customerJson.phoneNumber !== phoneNumber){
        //     const insertCustomer = await customersModel.query()
        //         .insert({
        //             phoneNumber : phoneNumber
        //         });
        // }

        // //verify OTP
        // await client.verify
        //     .v2
        //     .services(serviceSID)
        //     .verificationChecks.create({
        //         to: `+91${phoneNumber}`,
        //         code: otp,
        //     })
        //     .then(verificationChecks => res.status(200).send(verificationChecks));
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


module.exports = {
    signin,
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