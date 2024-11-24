const sendRes = require("../common/sendResponse");
const sendErr = require("../common/sendError");
const { Customers } = require("../db/models/customers");
const jwt = require("jsonwebtoken");
const errorHandling = require("../common/mongoErrorHandling");
const verifyCustomer = require("../controllers/authenticationController");
const { get } = require("../common/redisGetterSetter");
const verifyUser = require("../common/verifyOtp");
const sendSMS = require("./../common/sendOtp");
const { default: axios } = require("axios");

const insertCustomer = async (req, res) => {
  const { name, mobile_number, email, token } = req.body;
  try {
    //if account exists...
    const customer = await Customers.findOne({ mobile_number }).then((d) => d);

    if (customer) {
      return sendRes(res, 400, { message: "Account already exists" });
    }
    let pattern = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;
    const emailChecker = pattern.test(email);
    if (!emailChecker) {
      return sendRes(res, 400, { message: "Email id is not valid!" });
    }
    //Send OTP
    const response = await sendSMS(mobile_number);

    if (response.status !== 200) {
      return sendRes(res, response.status, { message: response.message });
    } else {
      const tobeinserted = await Customers.create({
        name: name,
        mobile_number: mobile_number,
        email: email,
      })
        .then((d) => d)
        .catch((err) => err);

      if (tobeinserted?.errorResponse) {
        const errorMessage = await errorHandling(tobeinserted?.errorResponse);
        return sendRes(res, 400, { message: errorMessage });
      }
      return sendRes(res, 200, { message: "Customer successfully signed up!" });
    }
  } catch (err) {
    console.log("SIGNUP CUSTOMER ERROR:", err);
    return sendErr(res, err);
  }
};

const getCustomerDetails = async (req, res) => {
  try {
    if (!req.user?.id) {
      throw Error("User not found");
    }
    const customer = await Customers.findOne({ _id: req.user?.id }).then(
      (d) => d
    );
    const details = {
      name: customer.name,
      mobile_number: customer.mobile_number,
      email: customer.email,
      is_email_verified: customer.is_email_verified,
    };

    return sendRes(res, 200, {
      data: {
        profile: details,
      },
      message: "Customer details fetched successfully",
    });
  } catch (err) {
    console.log("GET CUSTOMER DETAILS ERROR:", err);
    return sendErr(res, err);
  }
};

module.exports = {
  insertCustomer,
  getCustomerDetails,
};
