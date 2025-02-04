//Models
const sendSMS = require("./../common/sendOtp");
const verifyEmail = require("./../common/verifyEmail");
const verifyUser = require("../common/verifyOtp");
const sendRes = require("../common/sendResponse");
const sendError = require("../common/sendError");
const { remove } = require("../common/redisGetterSetter");
const PREFIX_OTP = process.env.PREFIX_OTP;
const PREFIX_EMAIL = process.env.PREFIX_EMAIL;
const { Customers } = require("../db/models/customers");
const { signJWT, verifyJWT } = require("./utils/jwtUtils");
const { default: axios } = require("axios");
const slackLog = require("./utils/slackLog");

const signin = async (req, res) => {
  const { mobile_number, token } = req.body;

  try {
    const customer = await Customers.findOne({ mobile_number }).then((d) => d);
    if (!customer)
      return sendRes(res, 400, { message: "Mobile Number is not registered" });
    //CALL sendOtp function
    const response = await sendSMS(mobile_number);
    return sendRes(res, response?.status, {
      message: response?.message,
      data: { ...(response?.data ?? {}) },
    });
  } catch (error) {
    await slackLog("SEND_OTP",error)
    return sendError(res, error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobile_number, otp } = req.body;
    const phoneCacheKey = PREFIX_OTP + mobile_number;
    let accessToken;

    const response = await verifyUser(mobile_number, otp);

    const customer = await Customers.findOne({
      mobile_number: mobile_number,
    }).then((d) => d);
    if (response.status === 200 && customer) {
      accessToken = signJWT(
        {
          id: customer._id,
          name: customer.name,
          mobile_number: customer.mobile_number,
        },
        "72h"
      );

      res.cookie("accessToken", accessToken, {
        maxAge: 9.461e7,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      await remove(phoneCacheKey);
    }

    return sendRes(res, response?.status, {
      data: {
        user: verifyJWT(accessToken).payload ?? {},
      },
      message: response?.message,
    });
  } catch (error) {
    await slackLog("VERIFY_OTP",error)
    return sendError(res, error);
  }
};

const checkstatus = async (req, res) => {
  const token = req.cookies?.accessToken;
  if (token === null || token === undefined) {
    return sendRes(res, 401, {
      message: "Access token is missing or invalid",
    });
  }

  const payload = verifyJWT(token).payload;

  if (payload === null) {
    return sendRes(res, 403, {
      message: "Access token is not valid",
    });
  }

  return sendRes(res, 200, {
    data: {
      user: payload ?? {},
    },
  });
};

const signout = async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  return sendRes(res, 200, {
    message: "Sign out successful!",
  });
};

module.exports = {
  signin,
  verifyOtp,
  checkstatus,
  signout,
};
