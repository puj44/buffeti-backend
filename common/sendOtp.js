/*
//AT SUCCESSFUL LOGIN DELETE THIS KEY
    "otp-{mobile_number}":{
        "otp":OTP,
        "lastRequest":DATETIME,
        'attempts': 5, (n-1) AT EVERY REQUEST AFTER INITIAL SENDING
    }

*/
/*
    RETURN RESPONSE/ERR OBJECT:
    {
        type:"success|error",
        payload:{}
        messsage:{message}
    }

*/

const response = require('../controllers/sendResponse');
const {twilioClient,serviceSID} = require('../config/twilio');
const moment = require('moment');
const sendResponse = require('../controllers/sendResponse');
const { get, set } = require('./redisGetterSetter');
const sendError = require('../controllers/sendError');


async function sendOtp(mobile_number){
    await client.connect();
    const prefix = "otp-";
    const phoneCacheKey = prefix+mobile_number;
    // let CacheKey = JSON.parse
    //     ({
    //         [phoneCacheKey]:{
    //             "otp":564321,
    //             "previousRequest": new Date(),
    //             "lastRequest": new Date(),
    //             "attempts":5,
    //         }
    //     });

    // 1. GET CURRENT otp-{mobile_number} CACHE VALUE IF EXISTS
    let loginData = await get(phoneCacheKey,true);
    const OTP = "123456";
    // 2. IF CACHE KEY EXISTS
    if (loginData != null){
        // loginData = JSON.parse(loginData);
        const lastRequest = loginData.lastRequest;
    /* 3. SCENARIOS FOR shouldContinue
        i. IF attempts value GOES TO 0, 
            THEN CHECK THE lastRequest DATETIME AND ONLY ALLOW REQUEST BY AFTER 10 MINUTES OF lastRequest( COMPARING WITH CURRENT DATETIME), 
            AFTER THAT RESET THE attempts to value 5, CALCULATE
        ii. CHECK IF CURRENT REQUEST IS MADE WITHIN 60 SECONDS OF LAST REQUEST, CALCULATE secondsLeft and send to frontend

    FOR i & ii:
    SEND ERROR MESSAGE ACCORDINGLY
    */

        let obj = loginData;
        obj.otp = OTP;
        obj.lastRequest = new Date();
        obj.previousRequest = lastRequest;

        if (loginData.attempts == 0){
            let timeUntilNextAttempt = new Date().getTime() - lastRequest.getTime();
            if (timeUntilNextAttempt >= 10){
                await OtpRequest(); 
                //set attempt back to 5
                obj.attempts = 5;
               
                
                //return all the required things
                return sendRes(res,200,
                    {
                        message:"Otp Successfuly Sent!",
                    }
                )
            }
            //SEND ERROR
            else{
                return sendRes(res,400,
                    {
                        message:"Maximum Attempt reached! Please try again after "+timeUntilNextAttempt+" seconds",
                        data:{
                            "secondsLeft":timeUntilNextAttempt //convert in seconds
                        }
                    }
                )
            }
        } 
        else {
            let timeDifference = obj.lastRequest - obj.previousRequest;
            let secondsLeft = 0;
            if( timeDifference <= 60 ){
                secondsLeft = timeDifference - new Date().getSeconds();
            }
            obj.attempts = obj.attempts - 1;
            await set(phoneCacheKey, obj, true);
            return sendRes(res,400,
                {
                    message:"Please try again after "+secondsLeft+" seconds",
                    data:{
                        "secondsLeft":secondsLeft //convert in seconds
                    }
                }
            )
        }
    }else{
        const obj = {
            "otp":OTP,
            "lastRequest":new Date(),
            "previousRequest":new Date(),
            'attempts': 4, 
        }
        await set(phoneCacheKey,obj,true);
    }

    async function OtpRequest(){
        try{
            // SEND OTP
            let res =await client.verify
                        .v2
                        .services(serviceSID)
                        .verifications.create({
                            to: `+91${mobile_number}`,
                            channel: 'sms',
                    })
                    .then(verifications => verifications);

        }catch(err){
            sendError(res,err);
        }
    }
}
module.exports = sendOtp;


// {
//     "status": "pending",
//     "payee": null,
//     "date_updated": "2024-05-25T16:27:54Z",
//     "send_code_attempts": [
//       {
//         "attempt_sid": "VL6a4991a54cb637ef9e853bbcc41de653",
//         "channel": "sms",
//         "time": "2024-05-25T16:27:54.000Z"
//       }
//     ],
//     "account_sid": "AC0bc783cf82cd30ef47dc570dc2c31797",
//     "to": "+919586808400",
//     "amount": null,
//     "valid": false,
//     "lookup": {
//       "carrier": null
//     },
//     "url": "https://verify.twilio.com/v2/Services/VA23b1b92391108f967816787877d397e3/Verifications/VE6c2e3c64d949bceeb3fe546bedd4ba5e",
//     "sid": "VE6c2e3c64d949bceeb3fe546bedd4ba5e",
//     "date_created": "2024-05-25T16:27:54Z",
//     "service_sid": "VA23b1b92391108f967816787877d397e3",
//     "channel": "sms"
//   }




// const accountSid = 'AC0bc783cf82cd30ef47dc570dc2c31797';
// const authToken = '[AuthToken]';
// const client = require('twilio')(accountSid, authToken);

// client.verify.v2.services("VA23b1b92391108f967816787877d397e3")
//       .verificationChecks
//       .create({to: '+919586808400', code: '[Code]'})
//       .then(verification_check => console.log(verification_check.status));
// {
//     "status": "approved",
//     "payee": null,
//     "date_updated": "2024-05-25T16:30:26Z",
//     "account_sid": "AC0bc783cf82cd30ef47dc570dc2c31797",
//     "to": "+919586808400",
//     "amount": null,
//     "valid": true,
//     "sid": "VE6c2e3c64d949bceeb3fe546bedd4ba5e",
//     "date_created": "2024-05-25T16:27:54Z",
//     "service_sid": "VA23b1b92391108f967816787877d397e3",
//     "channel": "sms"
//   }
  
  

