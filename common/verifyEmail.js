const { get } = require("./redisGetterSetter");

const PREFIX_EMAIL = process.env.PREFIX_EMAIL;

async function verifyEmail(email, otp) {
  const emailCacheKey = PREFIX_EMAIL + email;
  const emailData = await get(emailCacheKey, true);

  if (!emailData || !emailData?.otp) {
    return {
      status: 500,
      message: "There's a problem verifying the OTP, try again",
    };
  } else if (emailData.otp.toString() !== otp.toString()) {
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
