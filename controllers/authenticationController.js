
//Models
const sendSMS = require("./../common/sendOtp");
const sendRes = require("../common/sendResponse");
const sendError = require("../common/sendError");
const {get, set, remove} = require("../common/redisGetterSetter");
const jwt = require('jsonwebtoken');
const prefix = process.env.PREFIX_OTP;
const key = process.env.JWT_KEY;

const signin =  async (req, res) => {

    const mobile_number = req.body.mobile_number;

    try{
        //CALL sendOtp function
        const response = await sendSMS(mobile_number);
        return sendRes(res,response?.status,
            {
                message:response?.message,
                data:{...response?.data ?? {}}
            }
        );
    }catch(error){
        return sendError(res,error);
    }
}

const verifyOtp = async (req, res) =>{

    try{
        const mobile_number = req.body.mobile_number;
        const otp = req.body.otp;
        const phoneCacheKey = prefix+mobile_number;
        const value = await get(phoneCacheKey,true);
        
        if(!value || !value?.otp){
            return sendRes(res, 402, {message:"There's a problem verifying the OTP, try again"});
        }

        if(value.otp.toString() !== otp.toString()){
            return sendRes(res, 400, {message:"OTP is invalid."});
        }
        //todo: find doc and set _id.... also full name...
        let token = jwt.sign({_id: phoneCacheKey,'mobile_number':mobile_number}, key,{expiresIn: '72h'}); // TODO: After MONGODB registration, store ID of user instead of phoneCacheKey

        await remove(phoneCacheKey);

        return sendRes(
            res.cookie(
                "token",
                token,
                {expires: new Date(Date.now() + 72 * 3600000),httpOnly:true,sameSite:'none', secure:true}
            ), 
            200, 
            {message:"OTP verified successfully!"}
        );
        

    }catch(error){
        sendError(res,error);
    }
}


module.exports = {
    signin,
    verifyOtp,
}
