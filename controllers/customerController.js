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
            return sendRes(
                res,
                200, 
                {message:"Customer successfully signed up!"}
            );
        }
    }catch(err){
        sendErr(res,err)
    }
}

module.exports = {
    insertCustomer
}