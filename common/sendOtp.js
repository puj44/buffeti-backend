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
const redisClient = require('../config/redisClient');

redisClient.hset("otp-{mobile_number}",{
    "otp":564321,
    "lastRequest": "2024-05-18T05:28:28.000Z",
    'attempts':5,
})

export default async function sendOtp(mobile_number){
   const prefix = "otp-";
   const phoneNumber = prefix+mobile_number;
   const loginData = await redisClient.get(phoneNumber);
   let attempt = await redisClient.hGetAll(loginData).vals("attempts");
   let lastRequest = await redisClient.hGetAll(loginData).hVals("lastRequest");
   let date = new Date();

   if (loginData != null){
    if (attempt == 0){
        let timeDifference =  lastRequest.getTime() - date.getTime();
        if (timeDifference > 10){
            //send otp
            redisClient.hGetAll(phoneNumber).hGetAll("attempts").hset(5);
            timeDifference.getSeconds();

        }

        
    }
   }


   //GET CURRENT otp-{mobile_number} CACHE VALUE IF EXISTS
   // IF CACHE KEY EXISTS
    /*
    SCENARIOS FOR shouldContinue
        1. IF attempts value GOES TO 0, 
            THEN CHECK THE lastRequest DATETIME AND ONLY ALLOW REQUEST BY AFTER 10 MINUTES OF lastRequest( COMPARING WITH CURRENT DATETIME), 
            AFTER THAT RESET THE attempts to value 5, CALCULATE
        2. CHECK IF CURRENT REQUEST IS MADE WITHIN 60 SECONDS OF LAST REQUEST, CALCULATE secondsLeft and send to frontend

    FOR 1 & 2:
    SEND ERROR MESSAGE ACCORDINGLY
    */
 
    try{

        // SEND OTP
        // IF not first_time then UPON SUCCESSION, PUT CURRENT REQUEST TIME TO CACHE(DECREASE ATTEMPT ) else initilize in cache
        // RETURN RESPONSE(DONT SEND)

    }catch(err){
        // RETURN ERR(DONT SEND)
    }

}


