const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const verifyEmail = require("../common/verifyEmail");
const CustomerAddresses = require("../db/models/customerAddresses");
const Customers = require("../db/models/customers");
const sendEmail = require("../services/email/sendEmail");
const otpGenerator = require("otp-generator");
const { get, set, remove } = require("../common/redisGetterSetter");
const prefix = process.env.PREFIX_OTP;
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
    return sendResponse(res, 200, {
      data: {
        addresses: addresses ?? [],
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
  try {
    const customerDetails = await Customers.findOne({ _id: id }).lean();
    if (!customerDetails) {
      return sendResponse(res, 404, {
        message: "Customer not found",
      });
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
      const emailCacheKey = prefix + email;
      await set(emailCacheKey, obj, true);
      const emailVerificationResponse = await verifyEmail(email, OTP);
      if (!emailVerificationResponse) {
        return sendResponse(res, 400, { message: "Failed to verify email" });
      }
      const emailUpdate = await Customers.findByIdAndUpdate(
        { _id: id },
        {
          email,
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
          name,
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

module.exports = {
  addAddress,
  getAddress,
  editAddress,
  deleteAddress,
  updateProfile,
};
