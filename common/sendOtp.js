const { serviceSID, client } = require("../config/twilio");
const moment = require("moment");
const { get, set, remove } = require("./redisGetterSetter");
const otpGenerator = require("otp-generator");
const prefix = process.env.PREFIX_OTP;

async function sendOtp(mobile_number) {
  const phoneCacheKey = prefix + mobile_number;

  let loginData = await get(phoneCacheKey, true);

  const OTP =
    // process.env.ENV === "DEV"
    //   ? "1234"
    //   :
    otpGenerator.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
  if (loginData != null) {
    let obj = loginData;

    if (loginData.attempts == 0) {
      let timeUntilNextAttempt = moment(new Date()).diff(
        moment(obj.lastRequest),
        "seconds"
      );
      if (timeUntilNextAttempt >= 600) {
        const response = await OtpRequest();
        if (response === false) {
          return {
            status: 400,
            message: "Failed to send OTP, please try again later",
          };
        }
        //set attempt back to 5
        obj.otp = OTP;
        obj.attempts = 5;
        obj.lastRequest = moment(new Date());
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
    await set(phoneCacheKey, obj, true);
    return {
      status: 200,
      message: "Otp Successfuly Sent!",
    };
  }

  async function OtpRequest() {
    try {
      // SEND OTP
      if (process.env.ENV === "DEV") {
        const apiUrl = process.env.API_URL;
        const username = process.env.API_USERNAME;
        const apikey = process.env.API_KEY;
        const senderid = process.env.SENDER_ID;
        const TID = process.env.OTP_TEMPLATE_ID;
        const PEID = process.env.PE_ID;
        const route = process.env.ROUTE_OTP;
        const mobile = mobile_number;
        const text = `Your OTP is: ${OTP}. Use this code for verification. Do not share it with anyone. GNV CLICK2CATER`;

        const apiParams = new URLSearchParams({
          username,
          apikey,
          senderid,
          route,
          mobile,
          text,
          TID,
          PEID,
        });
        // http://13.234.156.238/api.php?username=gnvctc&apikey=&senderid=senderid&route=route_name&mobile=mobile_number&text=message&TID=template_id&PEID=peid
        const fullApiUrl = `${apiUrl}?${apiParams.toString()}`;

        const response = await axios.get(fullApiUrl);
        console.log(response);
        if (!response) {
          return false;
        }
        return true;
        // let res =await client.verify
        //             .v2
        //             .services(serviceSID)
        //             .verifications.create({
        //                 to: `+91${mobile_number}`,
        //                 channel: 'sms',
        //                 message:"Your Buffeti verification code is: "+OTP
        //         })
        //         .then(verifications => verifications);

        // client.messages
        //   .create({
        //     body: `Your Buffeti verification code is:${OTP}. This code will expire in 10 minutes.`,
        //     from: `+91${mobile_number}`,
        //     to: "+18777804236",
        //   })
        //   .then((message) => console.log(message.sid));
      } else {
        return true;
        //client sms API
      }
    } catch (err) {
      console.log("ASd", err);
      return false;
    }
  }
}
module.exports = sendOtp;
