const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const verifyEmailOtp = require("../common/verifyEmail");
const CustomerAddresses = require("../db/models/customerAddresses");
const { Customers } = require("../db/models/customers");
const sendEmail = require("../services/email/sendEmail");
const otpGenerator = require("otp-generator");
const { get, set, remove } = require("../common/redisGetterSetter");
const PREFIX_OTP = process.env.PREFIX_OTP;
const PREFIX_EMAIL = process.env.PREFIX_EMAIL;
const { default: mongoose } = require("mongoose");
const getAddress = async (req, res) => {
  try {
    const addresses = await CustomerAddresses.find({ customer: req.user.id });
    return sendResponse(res, 200, {
      data: {
        addresses: addresses ?? [],
      },
      message: "Addresses fetched successfully",
    });
  } catch (err) {
    console.log("GET ADDRESS ERROR:", err);
    sendError(res, err);
  }
};

const addAddress = async (req, res) => {
  try {
    const customerId = req.user.id;
    const data = {
      customer: customerId,
      ...req.body,
    };
    const addresses = await CustomerAddresses.find({ customer: req.user.id });
    if (addresses?.length === 5) {
      return sendResponse(res, 400, {
        message: "Maximum limit exceeded",
      });
    }
    await CustomerAddresses.create({
      ...data,
    });
    const updatedAddresses = await CustomerAddresses.find({
      customer: req.user.id,
    });
    return sendResponse(res, 200, {
      data: {
        addresses: updatedAddresses ?? [],
      },
      message: "Address added successfully",
    });
  } catch (err) {
    console.log("ADD ADDRESS ERROR:", err);
    sendError(res, err);
  }
};

const editAddress = async (req, res) => {
  try {
    const customerId = req.user.id;
    const addressId = req.params.id;
    const data = {
      ...req.body,
    };
    await CustomerAddresses.findOneAndUpdate(
      {
        _id: addressId,
        customer: customerId,
      },
      {
        ...data,
      }
    );
    const addresses = await CustomerAddresses.find({ customer: req.user.id });
    return sendResponse(res, 200, {
      data: {
        addresses: addresses ?? [],
      },
      message: "Address updated successfully",
    });
  } catch (err) {
    console.log("EDIT ADDRESS ERROR:", err);
    sendError(res, err);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const customerId = req.user.id;
    const addressId = req.params.id;
    const data = {
      ...req.body,
    };
    await CustomerAddresses.findOneAndDelete({
      _id: addressId,
      customer: customerId,
    });
    const addresses = await CustomerAddresses.find({ customer: req.user.id });
    return sendResponse(res, 200, {
      data: {
        addresses: addresses ?? [],
      },
      message: "Address deleted successfully",
    });
  } catch (err) {
    console.log("DELETE ADDRESS ERROR:", err);
    sendError(res, err);
  }
};
const updateProfile = async (req, res) => {
  const id = req.user.id;
  const { name, email } = req.body;
  const conn = mongoose.connection;
  const session = await conn.startSession();
  session.startTransaction();
  try {
    const customerDetails = await Customers.findOne({ _id: id }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer not found",
      });
    }

    let pattern = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;
    if (email) {
      const emailChecker = pattern.test(email);
      if (!emailChecker) {
        return sendRes(res, 400, { message: "Email id is not valid!" });
      }
      const dbEmail = customerDetails.email;
      const isVerified = customerDetails.is_email_verified ?? false;
      await Customers.findByIdAndUpdate(
        id,
        {
          name,
          email,
          is_email_verified: email !== dbEmail ? false : isVerified,
        },
        { session }
      );
    }

    await session.commitTransaction();
    return sendResponse(res, 200, {
      message: "Updated profile succesfully",
    });
  } catch (err) {
    await session.abortTransaction();
    console.log("UPDATE PROFILE ERROR:", err);
    return sendError(res, err);
  }
};

const sendOtpEmail = async (req, res) => {
  try {
    const id = req.user.id;
    const customerDetails = await Customers.findOne({ _id: id }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer not found",
      });
    }

    if (customerDetails.is_email_verified) {
      return sendResponse(res, 400, {
        message: "Email already verified!",
      });
    }
    // let pattern = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;
    // if (email) {
    //   const emailChecker = pattern.test(email);
    //   if (!emailChecker) {
    //     return sendRes(res, 400, { message: "Email id is not valid!" });
    //   }
    // }
    const emailCacheKey = PREFIX_EMAIL + customerDetails.email;
    const OTP = otpGenerator.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const body = `Your OTP is: ${OTP}. Use this code for verification. Do not share it with anyone. GNV CLICK2CATER`;
    const sendEmailResponse = sendEmail(
      customerDetails.email,
      "Email verification required",
      body,
      process.env.AUTH_EMAIL_NOREPLY
    );
    if (!sendEmailResponse) {
      throw new Error("Failed to send email");
    }
    let obj = {
      otp: OTP,
    };
    await set(emailCacheKey, obj, true);

    return sendResponse(res, 200, {
      message: "Otp sent succesfully",
    });
  } catch (err) {
    console.log("SEND OTP EMAIL ERROR:", err);
    return sendError(res, err);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const id = req.user.id;
    const { otp } = req.body;
    const customerDetails = await Customers.findOne({ _id: id }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer not found",
      });
    }
    const emailCacheKey = PREFIX_EMAIL + customerDetails.email;

    const response = await verifyEmailOtp(customerDetails.email, otp);

    if (response.status !== 200) {
      return sendResponse(res, response?.status, {
        response: response?.message,
      });
    } else {
      const emailVerify = await Customers.findOneAndUpdate(
        { _id: id },
        {
          email: customerDetails.email,
          is_email_verified: true,
        }
      );
      if (!emailVerify) {
        return sendResponse(res, 400, {
          message: "Failed to verify email!",
        });
      }
    }
    await remove(emailCacheKey);

    return sendResponse(res, response?.status, {
      message: response?.message,
    });
  } catch (error) {
    console.log("VERIFY EMAIL Error: ", error);
    sendError(res, error);
  }
};

module.exports = {
  addAddress,
  getAddress,
  editAddress,
  deleteAddress,
  updateProfile,
  sendOtpEmail,
  verifyEmail,
};
