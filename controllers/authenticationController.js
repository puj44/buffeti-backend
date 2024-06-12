
//Models
const sendSMS = require("./../common/sendOtp");
const sendRes = require("../common/sendResponse");
const sendError = require("../common/sendError");
const {get, set, remove} = require("../common/redisGetterSetter");
const jwt = require('jsonwebtoken');
const prefix = process.env.PREFIX_OTP;
const key = process.env.JWT_KEY;
const Customers = require("../db/models/customers");

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
        let token;
        
        const response = await verifyOtp(mobile_number,otp);
        Customers.findOne({mobile_number: mobile_number}).then((d)=>{
            token = jwt.sign({_id: d._id,'name': d.name,'mobile_number': d.mobile_number}, key,{expiresIn: '72h'});

        }).catch((err)=>err);
        
        await remove(phoneCacheKey);
        return sendRes(res,
            res.cookie(
                "token",
                token,
                {expires: new Date(Date.now() + 72 * 3600000),httpOnly:true,sameSite:'none', secure:true}
            ), 
            response?.status, 
            {message:response?.message}
        );
        

    }catch(error){
        sendError(res,error);
    }
}


module.exports = {
    signin,
    verifyOtp,
}
