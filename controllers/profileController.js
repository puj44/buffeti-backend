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
  const emailCacheKey = PREFIX_EMAIL + email;
  try {
    const customerDetails = await Customers.findOne({ _id: id }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer not found",
      });
    }

    let pattern = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;
    const emailChecker = pattern.test(email);
    if (!emailChecker) {
      return sendRes(res, 400, { message: "Email id is not valid!" });
    }

    const dbEmail = customerDetails.email;
    if (email != null && email !== dbEmail) {
      const OTP =
        process.env.ENV === "DEV"
          ? "1234"
          : otpGenerator.generate(4, {
              digits: true,
              upperCaseAlphabets: false,
              lowerCaseAlphabets: false,
              specialChars: false,
            });
      const body = `Your OTP is: ${OTP}. Use this code for verification. Do not share it with anyone. GNV CLICK2CATER`;
      const sendEmailResponse = sendEmail(
        email,
        "Email verification required",
        body,
        process.env.AUTH_EMAIL_NOREPLY
      );
      if (!sendEmailResponse) {
        return sendResponse(res, 400, { message: "Failed to send email" });
      }
      let obj = {
        otp: OTP,
      };

      await set(emailCacheKey, obj, true);
      const emailUpdate = await Customers.findByIdAndUpdate(
        { _id: id },
        {
          email: email,
          is_email_verified: false,
        }
      );
      if (!emailUpdate) {
        return sendResponse(res, 400, { message: "Failed to update email" });
      }
    }
    if (name) {
      const customerUpdate = await Customers.findByIdAndUpdate(
        { _id: id },
        {
          name: name,
        }
      );
      if (!customerUpdate) {
        return sendResponse(res, 400, { message: "Failed to update name" });
      }
    }

    return sendResponse(res, 200, {
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    sendError(res, err);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailCacheKey = PREFIX_EMAIL + email;

    const response = await verifyEmailOtp(email, otp);

    if (response.status !== 200) {
      return sendResponse(res, response?.status, {
        response: response?.message,
      });
    }
    const emailVerify = await Customers.findOneAndUpdate(
      { email: email },
      {
        is_email_verified: true,
      }
    );
    if (!emailVerify) {
      return sendResponse(res, 400, {
        message: "Failed to verify email!",
      });
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
  verifyEmail,
};
