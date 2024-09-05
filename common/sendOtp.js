const { serviceSID, client } = require("../config/twilio");
const moment = require("moment");
const { get, set, remove } = require("./redisGetterSetter");
const otpGenerator = require("otp-generator");
const { OtpRequest } = require("../config/smsRequests");
const prefix = process.env.PREFIX_OTP;

async function sendOtp(mobile_number) {
  const phoneCacheKey = prefix + mobile_number;

  let loginData = await get(phoneCacheKey, true);

  const OTP = otpGenerator.generate(4, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  try {
    if (loginData != null) {
      let obj = loginData;

      if (loginData.attempts == 0) {
        let timeUntilNextAttempt = moment(new Date()).diff(
          moment(obj.lastRequest),
          "seconds"
        );
        if (timeUntilNextAttempt >= 600) {
          //set attempt back to 5
          obj.otp = OTP;
          obj.attempts = 5;
          obj.lastRequest = moment(new Date());
          //CALL SMS API
          const otpResponse = await OtpRequest(OTP, mobile_number);
          if (!otpResponse) {
            return {
              status: 400,
              message:
                "There was a problem sending OTP, please check mobile number & try again.",
            };
          }
          await set(phoneCacheKey, obj, true);

          //return all the required things
          return {
            status: 200,
            message: "Otp Successfuly Sent!",
          };
        }
        //SEND ERROR
        else {
          const secondsLeft = 600 - parseInt(timeUntilNextAttempt);
          return {
            status: 400,
            message:
              "Maximum Attempt reached! Please try again after " +
              secondsLeft +
              " seconds",
            data: {
              secondsLeft: secondsLeft, //convert in seconds
              attempts: obj.attempts,
            },
          };
        }
      } else {
        let secondsDifference = moment(new Date()).diff(
          moment(obj.lastRequest),
          "seconds"
        );
        let secondsLeft = 0;
        if (secondsDifference > 30) {
          obj.otp = OTP;
          obj.attempts = obj.attempts - 1;
          obj.lastRequest = moment(new Date());
          //CALL SMS API
          const otpResponse = await OtpRequest(OTP, mobile_number);
          if (!otpResponse) {
            return {
              status: 400,
              message:
                "There was a problem sending OTP, please check mobile number & try again.",
            };
          }
          await set(phoneCacheKey, obj, true);
        } else {
          secondsLeft = parseInt(parseInt(30) - parseInt(secondsDifference));
        }

        return {
          status: secondsDifference <= 30 ? 400 : 200,
          message:
            secondsDifference <= 30
              ? "Please try again after " + secondsLeft + " seconds"
              : "OTP sent successfully",
          data: {
            secondsLeft: secondsLeft, //convert in seconds
            attempts: obj.attempts,
          },
        };
      }
    } else {
      const obj = {
        otp: OTP,
        lastRequest: moment(new Date()),
        attempts: 4,
      };
      const otpResponse = await OtpRequest(OTP, mobile_number);
      if (!otpResponse) {
        return {
          status: 400,
          message:
            "There was a problem sending OTP, please check mobile number & try again.",
        };
      }
      await set(phoneCacheKey, obj, true);
      return {
        status: 200,
        message: "Otp Successfuly Sent!",
      };
    }
  } catch (err) {
    console.log("SEND OTP FUNCTION ERROR:", err);
    return true;
  }
}
module.exports = sendOtp;
