const sendRes = require("../common/sendResponse");
const sendErr = require("../common/sendError");
const Customers = require('../db/models/customers');
const jwt = require('jsonwebtoken');
const errorHandling = require("../common/mongoErrorHandling");
const verifyCustomer = require("../controllers/authenticationController");
const { get } = require("../common/redisGetterSetter");
const verifyUser = require("../common/verifyOtp");
const sendSMS = require("./../common/sendOtp");


const insertCustomer = async (req,res) =>{
    const {name, mobile_number, email} = req.body;
    const phoneCacheKey = prefix+mobile_number;

    try{

        //if account exists...
        const customer = await Customers.findOne({mobile_number}).then((d) => d);

        if(customer){
            return sendRes(res, 402, {message:"Account already exists"});
        }

        //Send OTP
        const response = await sendSMS(mobile_number);

        if(response.status !== 200){

            return sendRes(
                res,response.status,{message:response.message}
            );

        }else{  

            const tobeinserted = await Customers.create({
                name:name,
                mobile_number:mobile_number,
                email:email,
            }).then((d)=>d).catch((err)=>err);
    
            if(tobeinserted?.errorResponse){
                const errorMessage = await errorHandling(tobeinserted?.errorResponse);
                return sendRes(
                    res,400,{message:errorMessage}
                )
            }

            //Get OTP from cache
            const loginData = await get(phoneCacheKey,true);

            //Verify OTP
            const verified = await verifyUser(mobile_number,loginData.otp);

            if(verified.status !== 200){

                return sendRes(
                    res,verified.status,{message:verified.message}
                );

            }else{

                const customer = await Customers.findOne({mobile_number: mobile_number}).then((d)=> d);

                if(response.status === 200 && customer){
                    accessToken = signJWT(
                        {
                            "id":customer._id,
                            "name":customer.name,
                            "mobile_number":customer.mobile_number
                        },
                        '72h'
                    )
                
                    res.cookie(
                        "accessToken",
                        accessToken,
                        {
                            maxAge:300000,
                            httpOnly:true,
                            sameSite:'none', 
                            secure:true
                        }
                    )
                    await remove(phoneCacheKey);
                }
                
                return sendRes(
                    res,
                    200, 
                    {
                        data: {
                            user:verifyJWT(accessToken).payload ?? {},
                            accessToken:accessToken
                        },
                        message:"Customer successfully signed up!"
                    }
                );
            }
        }
    }catch(err){
        sendErr(res,err)
    }
}

module.exports = {
    insertCustomer
}