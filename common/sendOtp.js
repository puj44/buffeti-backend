

const {serviceSID} = require('../config/twilio');
const moment = require('moment');
const { get, set, remove } = require('./redisGetterSetter');


async function sendOtp(res,mobile_number){
    const prefix = "otp-";
    const phoneCacheKey = prefix+mobile_number;

    let loginData = await get(phoneCacheKey,true);
    const OTP = "123456";
    // await remove(phoneCacheKey);

    if (loginData != null){

        let obj = loginData;
        obj.otp = OTP;
    
        if (loginData.attempts == 0){
            let timeUntilNextAttempt = moment(new Date()).diff(moment(obj.lastRequest),"seconds");
            if (timeUntilNextAttempt <= 600){
                await OtpRequest(); 
                //set attempt back to 5
                obj.attempts = 5;
                obj.lastRequest = moment(new Date());
                await set(phoneCacheKey, obj, true);

                //return all the required things
                return {
                    status:200,
                    message:"Otp Successfuly Sent!",
                } 
            }
            //SEND ERROR
            else{
                const secondsLeft =  600 - parseInt(timeUntilNextAttempt);
                return {
                    status:400,
                    message:"Maximum Attempt reached! Please try again after "+secondsLeft+" seconds",
                    data:{
                        "secondsLeft":secondsLeft, //convert in seconds
                        "attempts-":obj.attempts
                    }
                } 
            }
        } 
        else {
            let secondsDifference = moment(new Date()).diff(moment(obj.lastRequest),"seconds");
            console.log(moment(new Date()),moment(obj.lastRequest), "HERE", secondsDifference);
            let secondsLeft = 0;
            if(secondsDifference > 30){
                
                // obj.attempts =  obj.attempts - 1;
                obj.lastRequest = moment(new Date());
                await set(phoneCacheKey, obj, true);
            }else{
                secondsLeft = parseInt(parseInt(30) - parseInt(secondsDifference));
            }


            return {
                status: secondsDifference <= 30? 400 : 200,
                message:secondsDifference <= 30 ? "Please try again after "+secondsLeft+" seconds" :"OTP sent successfully",
                data:{
                    "secondsLeft":secondsLeft,//convert in seconds
                    "attempts":obj.attempts
                }
            } 
        }
    }else{
        const obj = {
            "otp":OTP,
            "lastRequest":moment(new Date()),
            "previousRequest":moment(new Date()),
            'attempts': 4, 
        }
        await set(phoneCacheKey,obj,true);
        return {
            status:200,
            message:"Otp Successfuly Sent!",
        } 
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


  

