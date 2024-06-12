const prefix  = process.env.PREFIX_OTP;

async function verifyOtp(mobile_number,otp){
    const phoneCacheKey = prefix+mobile_number;
    const loginData = await get(phoneCacheKey,true);

    if(!loginData || !loginData?.otp){
        return {
            status:402,
            message:"There's a problem verifying the OTP, try again",
        }
    }else if(loginData.otp.toString() !== otp.toString()){
        return {
            status:400,
            message:"OTP is invalid.",
        }
    }else{
        return{
            status:200,
            message:"OTP verified successfully!"
        }
    }
}