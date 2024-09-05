const { default: axios } = require("axios");

async function OtpRequest(otp, mobile) {
  try {
    // SEND OTP
    const msg = `Your OTP is: ${otp}. Use this code for verification. Do not share it with anyone. GNV CLICK2CATER`;
    if (process.env.ENV === "DEV") {
      return true;
    }
    const res = await axios.get(
      `http://13.234.156.238/api.php?username=gnvctc&apikey=${process.env.SMS_API_KEY}&senderid=${process.env.SMS_SENDER_ID}&route=TRANS&mobile=${mobile}&text=${msg}`
    );
    if (res?.status === 200) {
      return true;
    }
    console.log("SEND OTP SMS ERROR:", res?.status, res?.data ?? res);
    return false;
  } catch (err) {
    console.log("SEND OTP SMS ERROR:", err);
    return false;
  }
}
async function OrderPlacedSms(name, order_number, mobile) {
  try {
    // PLACE ORDER SMS
    const msg = `Dear ${name}, your order (ID: ${order_number}) has been placed successfully. Check your email for confirmation. Thanks for choosing us! GNV CLICK2CATER.`;

    const res = await axios.get(
      `http://13.234.156.238/api.php?username=gnvctc&apikey=${process.env.SMS_API_KEY}&senderid=${process.env.SMS_SENDER_ID}&route=TRANS&mobile=${mobile}&text=${msg}`
    );
    if (res?.status === 200) {
      return true;
    }
    console.log("PLACE ORDER SMS ERROR:", res?.status, res?.data ?? res);
    return false;
  } catch (err) {
    console.log("PLACE ORDER SMS ERROR:", err);
    return false;
  }
}

module.exports = { OtpRequest, OrderPlacedSms };
