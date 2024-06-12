
//Models
const sendSMS = require("./../common/sendOtp");
const verifyUser = require("./../common/verifyOtp");
const sendRes = require("../common/sendResponse");
const sendError = require("../common/sendError");
const { remove} = require("../common/redisGetterSetter");
const prefix = process.env.PREFIX_OTP;
const Customers = require("../db/models/customers");
const { signJWT, verifyJWT } = require("./utils/jwtUtils");

const signin =  async (req, res) => {

    const {mobile_number} = req.body;

    try{
        const customer = await Customers.findOne({mobile_number}).then((d) => d);
        if(!customer) return sendRes(res, 402, {message:"Mobile Number is not registered"})
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
        const {mobile_number,otp} = req.body;
        const phoneCacheKey = prefix+mobile_number;
        let accessToken;
        
        const response = await verifyUser(mobile_number,otp);

        const customer = await Customers.findOne({mobile_number: mobile_number}).then((d)=> d)
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
            response?.status, 
            {
                data: {
                    user:verifyJWT(accessToken).payload ?? {},
                    accessToken:accessToken
                },
                message:response?.message
            }
        );
        

    }catch(error){
        console.log("VERIFY OTP: ",error);
        sendError(res,error);
    }
}


module.exports = {
    signin,
    verifyOtp,
}
