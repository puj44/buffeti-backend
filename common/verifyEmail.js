const { get } = require("./redisGetterSetter");

const prefix = process.env.PREFIX_OTP;

async function verifyEmail(email, otp) {
  const emailCacheKey = prefix + email;
  const emailData = await get(emailCacheKey, true);
  if (!emailData || !emailData?.otp) {
    return {
      status: 500,
      message: "There's a problem verifying the OTP, try again",
    };
  } else if (loginData.otp.toString() !== otp.toString()) {
    return {
      status: 401,
      message: "OTP is invalid.",
    };
  } else {
    return {
      status: 200,
      message: "OTP verified successfully!",
    };
  }
}

module.exports = verifyEmail;
